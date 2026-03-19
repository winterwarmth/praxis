import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

import { ListingCourse, ListingService } from '../../shared/services/listing.service';
import { SupabaseService } from '../../core/services/supabase.service';

const CATEGORIES = [
  'Clothing',
  'Electronics',
  'Food',
  'Furniture',
  'Rent',
  'Textbooks',
  'Tickets',
  'Services',
  'Other',
] as const;

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-create-listing-page',
  imports: [FormsModule, NgIcon],
  templateUrl: './create-listing-page.html',
  styleUrl: './create-listing-page.scss',
})
export class CreateListingPage implements OnInit {
  private readonly listingService = inject(ListingService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly categories = CATEGORIES;
  readonly conditions = CONDITIONS;

  title = '';
  description = '';
  price: number | null = null;
  category = '';
  condition = '';

  readonly images = signal<ImagePreview[]>([]);
  readonly submitting = signal(false);
  readonly error = signal('');

  // Courses
  readonly selectedCourses = signal<ListingCourse[]>([]);
  readonly allCourses = signal<ListingCourse[]>([]);
  readonly filteredCourses = signal<ListingCourse[]>([]);
  readonly courseSearchQuery = signal('');
  readonly selectedSemesterTags = signal<{ id: string; name: string }[]>([]);
  readonly pendingRemoveSemester = signal<string | null>(null);
  private semesterResetTimer: ReturnType<typeof setTimeout> | null = null;
  semesterTerm = '';
  semesterYear: number | null = null;

  ngOnInit(): void {
    this.http.get<ListingCourse[]>('/api/courses').subscribe((courses) => this.allCourses.set(courses));
  }

  onCourseSearch(query: string): void {
    this.courseSearchQuery.set(query);
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredCourses.set([]);
      return;
    }
    this.filteredCourses.set(
      this.allCourses().filter((c) =>
        `${c.subjectCode} ${c.courseNumber}`.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q)
      ).slice(0, 10)
    );
  }

  isCourseSelected(courseId: string): boolean {
    return this.selectedCourses().some((c) => c.id === courseId);
  }

  toggleCourse(course: ListingCourse): void {
    if (this.isCourseSelected(course.id)) {
      this.selectedCourses.set(this.selectedCourses().filter((c) => c.id !== course.id));
    } else {
      this.selectedCourses.set([...this.selectedCourses(), course]);
    }
  }

  removeCourse(courseId: string): void {
    this.selectedCourses.set(this.selectedCourses().filter((c) => c.id !== courseId));
  }

  filterYearInput(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowed.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  addSemester(): void {
    if (!this.semesterTerm || !this.semesterYear) return;
    const currentYear = new Date().getFullYear();
    if (this.semesterYear < 1900 || this.semesterYear > currentYear) return;
    const name = `${this.semesterTerm.charAt(0).toUpperCase() + this.semesterTerm.slice(1)} ${this.semesterYear}`;
    const existing = this.selectedSemesterTags().find((s) => s.name === name);
    if (existing) return;

    this.http.post<{ id: string }>('/api/semesters/find-or-create', { term: this.semesterTerm, year: this.semesterYear, name }).subscribe({
      next: (result) => {
        this.selectedSemesterTags.set([...this.selectedSemesterTags(), { id: result.id, name }]);
        this.semesterTerm = '';
        this.semesterYear = null;
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClickSemester(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.pendingRemoveSemester() && !target.closest('.semester-tag')) {
      this.pendingRemoveSemester.set(null);
      this.clearSemesterTimer();
    }
  }

  clickSemester(id: string): void {
    if (this.pendingRemoveSemester() === id) {
      this.selectedSemesterTags.set(this.selectedSemesterTags().filter((s) => s.id !== id));
      this.pendingRemoveSemester.set(null);
      this.clearSemesterTimer();
    } else {
      this.clearSemesterTimer();
      this.pendingRemoveSemester.set(id);
      this.semesterResetTimer = setTimeout(() => {
        this.pendingRemoveSemester.set(null);
        this.semesterResetTimer = null;
      }, 3000);
    }
  }

  private clearSemesterTimer(): void {
    if (this.semesterResetTimer) {
      clearTimeout(this.semesterResetTimer);
      this.semesterResetTimer = null;
    }
  }

  removeSemester(id: string): void {
    this.selectedSemesterTags.set(this.selectedSemesterTags().filter((s) => s.id !== id));
    this.pendingRemoveSemester.set(null);
  }

  filterPriceInput(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', '.'];
    if (allowed.includes(event.key)) return;
    if (event.key === '.' && String(this.price).includes('.')) {
      event.preventDefault();
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    const current = this.images();
    const newImages: ImagePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      if (current.length + newImages.length >= 5) break;
      const file = files[i];
      newImages.push({ file, url: URL.createObjectURL(file) });
    }

    this.images.set([...current, ...newImages]);
    input.value = '';
  }

  removeImage(index: number): void {
    const current = this.images();
    URL.revokeObjectURL(current[index].url);
    this.images.set(current.filter((_, i) => i !== index));
  }

  async submit(): Promise<void> {
    if (!this.title.trim() || !this.category || this.price == null) {
      this.error.set('Please fill in title, category, and price.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      // Create listing first (no images yet)
      this.listingService
        .createListing({
          title: this.title.trim(),
          description: this.description.trim() || undefined,
          price: this.price,
          category: this.category,
          condition: this.condition || undefined,
        })
        .subscribe({
          next: async (result) => {
            // Upload images only after listing is created
            const imageUrls: string[] = [];
            const supabase = this.supabaseService.getClient();

            for (const img of this.images()) {
              const filePath = `listings/${result.id}/${Date.now()}-${img.file.name}`;
              const { error: uploadError } = await supabase.storage
                .from('listing-images')
                .upload(filePath, img.file);

              if (uploadError) continue;

              const { data: urlData } = supabase.storage
                .from('listing-images')
                .getPublicUrl(filePath);

              imageUrls.push(urlData.publicUrl);
            }

            if (imageUrls.length > 0) {
              this.listingService
                .addListingImages(result.id, imageUrls)
                .subscribe({
                  next: () => this.saveCourses(result.id),
                  error: () => this.saveCourses(result.id),
                });
            } else {
              this.saveCourses(result.id);
            }
          },
          error: () => {
            this.error.set('Failed to create listing.');
            this.submitting.set(false);
          },
        });
    } catch {
      this.error.set('Something went wrong.');
      this.submitting.set(false);
    }
  }

  private saveCourses(listingId: string): void {
    const courseIds = this.selectedCourses().map((c) => c.id);
    const semesterIds = this.selectedSemesterTags().map((s) => s.id);

    const saveSemesters = () => {
      if (semesterIds.length > 0) {
        this.listingService.setListingSemesters(listingId, semesterIds).subscribe({
          next: () => this.router.navigate(['/listing', listingId]),
          error: () => this.router.navigate(['/listing', listingId]),
        });
      } else {
        this.router.navigate(['/listing', listingId]);
      }
    };

    if (courseIds.length > 0) {
      this.listingService.setListingCourses(listingId, courseIds).subscribe({
        next: () => saveSemesters(),
        error: () => saveSemesters(),
      });
    } else {
      saveSemesters();
    }
  }
}
