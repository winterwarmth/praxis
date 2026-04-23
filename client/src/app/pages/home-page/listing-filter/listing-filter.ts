import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface CourseOption {
  id: string;
  subjectCode: string;
  courseNumber: string;
  courseName: string;
}

@Component({
  selector: 'app-listing-filter',
  imports: [],
  templateUrl: './listing-filter.html',
  styleUrl: './listing-filter.scss',
})
export class ListingFilter implements OnInit {
  private http = inject(HttpClient);
  readonly initialPayments = input<string[]>([]);
  private hasAppliedInitial = false;

  constructor() {
    effect(() => {
      const initial = this.initialPayments();
      if (!this.hasAppliedInitial && initial.length > 0) {
        this.selectedPayments.set([...initial]);
        this.hasAppliedInitial = true;
      }
    });
  }
  readonly sortOptions = [
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'condition', label: 'Condition: Best First' },
    { value: 'free', label: 'Free' },
  ];

  readonly conditionOptions = [
    { value: '', label: 'Any' },
    { value: 'fair', label: 'Fair or better' },
    { value: 'good', label: 'Good or better' },
    { value: 'like_new', label: 'Like New or better' },
    { value: 'new', label: 'New only' },
  ];

  readonly categories = [
    'All',
    'Clothing',
    'Electronics',
    'Food',
    'Furniture',
    'Rent',
    'Textbooks',
    'Tickets',
    'Services',
    'Other'
  ];

  readonly paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'cashapp', label: 'Cash App' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'venmo', label: 'Venmo' },
    { value: 'zelle', label: 'Zelle' },
  ];

  readonly sortBy = signal('price-low');
  readonly selected = signal('All');
  readonly priceMin = signal<number | null>(null);
  readonly priceMax = signal<number | null>(null);
  readonly selectedPayments = signal<string[]>([]);
  readonly minCondition = signal<string>('');
  readonly freeOnly = signal(false);
  readonly courseQuery = signal('');
  readonly allCourses = signal<CourseOption[]>([]);
  readonly filteredCourses = signal<CourseOption[]>([]);
  readonly selectedCourse = signal<CourseOption | null>(null);
  readonly sortChange = output<string>();
  readonly select = output<string>();
  readonly priceChange = output<{ min: number | null; max: number | null }>();
  readonly paymentChange = output<string[]>();
  readonly courseChange = output<string>();
  readonly conditionChange = output<string>();
  readonly freeOnlyChange = output<boolean>();

  onSelect(category: string): void {
    this.selected.set(category);
    this.select.emit(category);
  }

  onConditionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.minCondition.set(value);
    this.conditionChange.emit(value);
  }

  onTogglePayment(method: string): void {
    const current = this.selectedPayments();
    if (current.includes(method)) {
      this.selectedPayments.set(current.filter(m => m !== method));
    } else {
      this.selectedPayments.set([...current, method]);
    }
    this.paymentChange.emit(this.selectedPayments());
  }

  onPriceMinInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.priceMin.set(value ? Number(value) : null);
    this.priceChange.emit({ min: this.priceMin(), max: this.priceMax() });
  }

  onPriceMaxInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.priceMax.set(value ? Number(value) : null);
    this.priceChange.emit({ min: this.priceMin(), max: this.priceMax() });
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);
    const isFree = value === 'free';
    if (this.freeOnly() !== isFree) {
      this.freeOnly.set(isFree);
      this.freeOnlyChange.emit(isFree);
    }
    this.sortChange.emit(value);
  }

  ngOnInit(): void {
    this.http.get<CourseOption[]>('/api/courses').subscribe((courses) => this.allCourses.set(courses));
  }

  onCourseInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.courseQuery.set(value);
    const q = value.toLowerCase().trim();
    if (!q) {
      this.filteredCourses.set([]);
      if (this.selectedCourse()) {
        this.selectedCourse.set(null);
        this.courseChange.emit('');
      }
      return;
    }
    this.filteredCourses.set(
      this.allCourses().filter((c) =>
        `${c.subjectCode} ${c.courseNumber}`.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }

  selectCourse(course: CourseOption): void {
    this.selectedCourse.set(course);
    this.courseQuery.set(`${course.subjectCode} ${course.courseNumber}`);
    this.filteredCourses.set([]);
    this.courseChange.emit(course.id);
  }

  clearCourse(): void {
    this.selectedCourse.set(null);
    this.courseQuery.set('');
    this.filteredCourses.set([]);
    this.courseChange.emit('');
  }
}
