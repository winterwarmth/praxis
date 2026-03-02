import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-listing-filter',
  imports: [],
  templateUrl: './listing-filter.html',
  styleUrl: './listing-filter.scss',
})
export class ListingFilter {
  readonly sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
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

  readonly paymentMethods = ['Cash', 'Cash App', 'PayPal', 'Venmo', 'Zelle'];

  readonly sortBy = signal('newest');
  readonly selected = signal('All');
  readonly priceMin = signal<number | null>(null);
  readonly priceMax = signal<number | null>(null);
  readonly selectedPayments = signal<string[]>([]);
  readonly courseQuery = signal('');
  readonly sortChange = output<string>();
  readonly select = output<string>();
  readonly priceChange = output<{ min: number | null; max: number | null }>();
  readonly paymentChange = output<string[]>();
  readonly courseChange = output<string>();

  onSelect(category: string): void {
    this.selected.set(category);
    this.select.emit(category);
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
    this.sortChange.emit(value);
  }

  onCourseInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.courseQuery.set(value);
    this.courseChange.emit(value);
  }
}
