import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

import { SavedItemsService } from '../../shared/services/saved-items.service';
import { ListingCourse, ListingDetail, ListingImage, ListingService } from '../../shared/services/listing.service';
import { MessagingService } from '../../shared/services/messaging.service';
import { SupabaseService } from '../../core/services/supabase.service';

interface ImagePreview {
  file: File;
  url: string;
}

interface SellerReviews {
  averageRating: number;
  totalReviews: number;
}

interface CurrentUser {
  id: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  cashapp: 'Cash App',
  paypal: 'PayPal',
  venmo: 'Venmo',
  zelle: 'Zelle',
};

const CATEGORIES = [
  'clothing', 'electronics', 'food', 'furniture', 'rent',
  'textbooks', 'tickets', 'services', 'other',
] as const;

const CONDITIONS = [
  { value: '', label: 'None' },
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

@Component({
  selector: 'app-listing-detail-page',
  imports: [RouterLink, CurrencyPipe, FormsModule, NgIcon],
  templateUrl: './listing-detail-page.html',
  styleUrl: './listing-detail-page.scss',
})
export class ListingDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly savedItems = inject(SavedItemsService);
  private readonly listingService = inject(ListingService);
  private readonly messagingService = inject(MessagingService);
  private readonly http = inject(HttpClient);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  protected readonly listing = signal<ListingDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedImageIndex = signal(0);
  protected readonly sellerReviews = signal<SellerReviews | null>(null);
  protected readonly currentUserId = signal<string | null>(null);

  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);
  protected editForm = { title: '', description: '', price: 0, category: '', condition: '', status: 'active' };
  protected readonly confirmingDelete = signal(false);
  private deleteTimer: ReturnType<typeof setTimeout> | null = null;
  private autoResetTimer: ReturnType<typeof setTimeout> | null = null;
  protected readonly editImages = signal<ListingImage[]>([]);
  protected readonly newImagePreviews = signal<ImagePreview[]>([]);
  private removedImageIds: string[] = [];

  // Course editing
  protected readonly editCourses = signal<ListingCourse[]>([]);
  protected readonly allCourses = signal<ListingCourse[]>([]);
  protected readonly filteredCourses = signal<ListingCourse[]>([]);
  protected readonly courseSearchQuery = signal('');
  protected readonly editSemesterTags = signal<{ id: string; name: string }[]>([]);
  protected readonly pendingRemoveSemester = signal<string | null>(null);
  private semesterResetTimer: ReturnType<typeof setTimeout> | null = null;
  protected semesterTerm = '';
  protected semesterYear: number | null = null;

  // Drag state
  protected readonly dragIndex = signal<number | null>(null);
  protected readonly dragType = signal<'existing' | 'new' | null>(null);
  protected readonly dragOverIndex = signal<number | null>(null);
  protected readonly dragOverType = signal<'existing' | 'new' | null>(null);

  protected readonly categories = CATEGORIES;
  protected readonly conditions = CONDITIONS;

  protected readonly isOwner = computed(() => {
    const l = this.listing();
    const userId = this.currentUserId();
    if (!l || !userId) return false;
    return l.sellerId === userId;
  });

  protected readonly isSaved = computed(() => {
    const l = this.listing();
    if (!l) return false;
    return this.savedItems.isSaved(l.id);
  });

  protected readonly selectedImageUrl = computed(() => {
    const l = this.listing();
    const idx = this.selectedImageIndex();
    if (!l || l.images.length === 0) return null;
    return l.images[idx]?.imageUrl ?? null;
  });

  protected readonly paymentMethods = computed(() => {
    const seller = this.listing()?.seller;
    if (!seller?.preferredPaymentMethods) return [];
    return seller.preferredPaymentMethods
      .split(',')
      .filter(Boolean)
      .map((m) => PAYMENT_LABELS[m] || m);
  });

  protected readonly timeAgo = computed(() => {
    const l = this.listing();
    if (!l) return '';
    const now = Date.now();
    const posted = new Date(l.createdAt).getTime();
    const diffMs = now - posted;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return `Posted ${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `Posted ${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `Posted ${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `Posted ${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `Posted ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Posted just now';
  });

  ngOnInit(): void {
    this.http.get<CurrentUser>('/api/auth/me').subscribe({
      next: (user) => this.currentUserId.set(user.id),
      error: () => {},
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadListing(id);
      }
    });
  }

  private loadListing(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.listingService.getListing(id).subscribe({
      next: (listing) => {
        this.listing.set(listing);
        this.selectedImageIndex.set(0);
        this.loading.set(false);
        if (listing.seller) {
          this.http
            .get<SellerReviews>(`/api/users/${listing.seller.id}/reviews`)
            .subscribe((data) => this.sellerReviews.set(data));
        }
      },
      error: () => {
        this.error.set('Listing not found.');
        this.loading.set(false);
      },
    });
  }

  protected selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  protected getStars(rating: number): string {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }

  protected toggleSave(): void {
    const l = this.listing();
    if (!l) return;
    this.savedItems.toggleSave({
      id: l.id,
      title: l.title,
      imageUrl: l.images[0]?.imageUrl ?? null,
      price: l.price,
      condition: l.condition,
    });
  }

  protected readonly contacting = signal(false);

  protected contactSeller(): void {
    const l = this.listing();
    if (!l?.seller || this.contacting()) return;
    this.contacting.set(true);
    const initialMessage = `Hi, I'm interested in your "${l.title}".`;
    this.messagingService.sendMessage(l.seller.id, l.id, initialMessage).subscribe({
      next: () => {
        this.router.navigate(['/messages', 'thread', l.seller!.id, l.id]);
      },
      error: () => this.contacting.set(false),
    });
  }

  protected onDragStart(index: number, type: 'existing' | 'new'): void {
    this.dragIndex.set(index);
    this.dragType.set(type);
  }

  protected onDragOver(event: DragEvent, index: number, type: 'existing' | 'new'): void {
    event.preventDefault();
    this.dragOverIndex.set(index);
    this.dragOverType.set(type);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const fromIdx = this.dragIndex();
    const fromType = this.dragType();
    const toIdx = this.dragOverIndex();
    const toType = this.dragOverType();
    if (fromIdx == null || toIdx == null || fromType == null || toType == null) return;

    // Build unified list: existing images first, then new
    const items: { type: 'existing' | 'new'; index: number }[] = [
      ...this.editImages().map((_, i) => ({ type: 'existing' as const, index: i })),
      ...this.newImagePreviews().map((_, i) => ({ type: 'new' as const, index: i })),
    ];

    const fromGlobal = fromType === 'existing' ? fromIdx : this.editImages().length + fromIdx;
    const toGlobal = toType === 'existing' ? toIdx : this.editImages().length + toIdx;

    const [moved] = items.splice(fromGlobal, 1);
    items.splice(toGlobal, 0, moved);

    // Rebuild arrays from new order
    const existingImages = this.editImages();
    const newImages = this.newImagePreviews();
    const reorderedExisting: ListingImage[] = [];
    const reorderedNew: ImagePreview[] = [];

    for (const item of items) {
      if (item.type === 'existing') reorderedExisting.push(existingImages[item.index]);
      else reorderedNew.push(newImages[item.index]);
    }

    this.editImages.set(reorderedExisting);
    this.newImagePreviews.set(reorderedNew);
    this.onDragEnd();
  }

  protected onDragEnd(): void {
    this.dragIndex.set(null);
    this.dragType.set(null);
    this.dragOverIndex.set(null);
    this.dragOverType.set(null);
  }

  protected filterPriceInput(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', '.'];
    if (allowed.includes(event.key)) return;
    if (event.key === '.' && String(this.editForm.price).includes('.')) {
      event.preventDefault();
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  protected startEditing(): void {
    const l = this.listing();
    if (!l) return;
    this.editForm = {
      title: l.title,
      description: l.description || '',
      price: l.price,
      category: l.category,
      condition: l.condition || '',
      status: l.status,
    };
    this.editImages.set([...l.images]);
    this.newImagePreviews.set([]);
    this.removedImageIds = [];
    this.editCourses.set(l.courses ? [...l.courses] : []);
    this.courseSearchQuery.set('');
    this.filteredCourses.set([]);
    this.http.get<ListingCourse[]>('/api/courses').subscribe((courses) => this.allCourses.set(courses));
    this.editSemesterTags.set(l.semesters ? l.semesters.map((s) => ({ id: s.id, name: s.name })) : []);
    this.isEditing.set(true);
  }

  protected cancelEditing(): void {
    this.newImagePreviews().forEach((img) => URL.revokeObjectURL(img.url));
    this.newImagePreviews.set([]);
    this.isEditing.set(false);
  }

  protected removeExistingImage(index: number): void {
    const current = this.editImages();
    this.removedImageIds.push(current[index].id);
    this.editImages.set(current.filter((_, i) => i !== index));
  }

  protected removeNewImage(index: number): void {
    const current = this.newImagePreviews();
    URL.revokeObjectURL(current[index].url);
    this.newImagePreviews.set(current.filter((_, i) => i !== index));
  }

  protected onEditImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    const total = this.editImages().length + this.newImagePreviews().length;
    const newImages: ImagePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      if (total + newImages.length >= 5) break;
      newImages.push({ file: files[i], url: URL.createObjectURL(files[i]) });
    }

    this.newImagePreviews.set([...this.newImagePreviews(), ...newImages]);
    input.value = '';
  }

  protected onCourseSearch(query: string): void {
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

  protected isEditCourseSelected(courseId: string): boolean {
    return this.editCourses().some((c) => c.id === courseId);
  }

  protected toggleEditCourse(course: ListingCourse): void {
    if (this.isEditCourseSelected(course.id)) {
      this.editCourses.set(this.editCourses().filter((c) => c.id !== course.id));
    } else {
      this.editCourses.set([...this.editCourses(), course]);
    }
  }

  protected removeEditCourse(courseId: string): void {
    this.editCourses.set(this.editCourses().filter((c) => c.id !== courseId));
  }

  protected filterYearInput(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowed.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  protected addSemester(): void {
    if (!this.semesterTerm || !this.semesterYear) return;
    const currentYear = new Date().getFullYear();
    if (this.semesterYear < 1900 || this.semesterYear > currentYear) return;
    const name = `${this.semesterTerm.charAt(0).toUpperCase() + this.semesterTerm.slice(1)} ${this.semesterYear}`;
    const existing = this.editSemesterTags().find((s) => s.name === name);
    if (existing) return;

    this.http.post<{ id: string }>('/api/semesters/find-or-create', { term: this.semesterTerm, year: this.semesterYear, name }).subscribe({
      next: (result) => {
        this.editSemesterTags.set([...this.editSemesterTags(), { id: result.id, name }]);
        this.semesterTerm = '';
        this.semesterYear = null;
      },
    });
  }

  protected clickSemester(id: string): void {
    if (this.pendingRemoveSemester() === id) {
      this.editSemesterTags.set(this.editSemesterTags().filter((s) => s.id !== id));
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

  protected async saveEdits(): Promise<void> {
    const l = this.listing();
    if (!l || !this.editForm.title.trim()) return;

    this.isSaving.set(true);

    // Update listing fields
    this.listingService
      .updateListing(l.id, {
        title: this.editForm.title.trim(),
        description: this.editForm.description.trim(),
        price: this.editForm.price,
        category: this.editForm.category,
        condition: this.editForm.condition || undefined,
        status: this.editForm.status,
      })
      .subscribe({
        next: async () => {
          // Delete removed images
          for (const imageId of this.removedImageIds) {
            await this.deleteListingImage(l.id, imageId);
          }

          // Update display order for remaining existing images
          const reorderedIds = this.editImages().map((img) => img.id);
          if (reorderedIds.length > 0) {
            await this.reorderListingImages(l.id, reorderedIds);
          }

          // Upload new images (they get appended after existing)
          const newUrls: string[] = [];
          const supabase = this.supabaseService.getClient();
          for (const img of this.newImagePreviews()) {
            const filePath = `listings/${l.id}/${Date.now()}-${img.file.name}`;
            const { error: uploadError } = await supabase.storage
              .from('listing-images')
              .upload(filePath, img.file);
            if (uploadError) continue;
            const { data: urlData } = supabase.storage
              .from('listing-images')
              .getPublicUrl(filePath);
            newUrls.push(urlData.publicUrl);
          }

          if (newUrls.length > 0) {
            this.listingService.addListingImages(l.id, newUrls).subscribe({
              next: () => this.finishEditing(l.id),
              error: () => this.finishEditing(l.id),
            });
          } else {
            this.finishEditing(l.id);
          }
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
  }

  private finishEditing(listingId: string): void {
    const courseIds = this.editCourses().map((c) => c.id);
    this.listingService.setListingCourses(listingId, courseIds).subscribe({
      next: () => {
        const semesterIds = this.editSemesterTags().map((s) => s.id);
        this.listingService.setListingSemesters(listingId, semesterIds).subscribe({
          next: () => this.completeEditing(listingId),
          error: () => this.completeEditing(listingId),
        });
      },
      error: () => this.completeEditing(listingId),
    });
  }

  private completeEditing(listingId: string): void {
    this.newImagePreviews().forEach((img) => URL.revokeObjectURL(img.url));
    this.newImagePreviews.set([]);
    this.isEditing.set(false);
    this.isSaving.set(false);
    this.loadListing(listingId);
  }

  private reorderListingImages(listingId: string, imageIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      this.http.put(`/api/listings/${listingId}/images/reorder`, imageIds).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      });
    });
  }

  private deleteListingImage(listingId: string, imageId: string): Promise<void> {
    return new Promise((resolve) => {
      this.http.delete(`/api/listings/${listingId}/images/${imageId}`).subscribe({
        next: () => resolve(),
        error: () => resolve(),
      });
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.confirmingDelete() && !target.closest('.btn-delete')) {
      this.confirmingDelete.set(false);
      this.clearDeleteTimers();
    }
    if (this.pendingRemoveSemester() && !target.closest('.semester-tag')) {
      this.pendingRemoveSemester.set(null);
      this.clearSemesterTimer();
    }
  }

  protected deleteListing(): void {
    const l = this.listing();
    if (!l) return;

    if (this.confirmingDelete()) {
      this.clearDeleteTimers();
      this.listingService.updateListing(l.id, { status: 'removed' }).subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => this.confirmingDelete.set(false),
      });
    } else {
      this.confirmingDelete.set(true);
      this.autoResetTimer = setTimeout(() => {
        this.confirmingDelete.set(false);
        this.autoResetTimer = null;
      }, 3000);
    }
  }

  protected delayCancelDelete(): void {
    this.deleteTimer = setTimeout(() => {
      this.confirmingDelete.set(false);
      this.deleteTimer = null;
    }, 1000);
  }

  protected keepDelete(): void {
    if (this.deleteTimer) {
      clearTimeout(this.deleteTimer);
      this.deleteTimer = null;
    }
  }

  private clearDeleteTimers(): void {
    if (this.deleteTimer) { clearTimeout(this.deleteTimer); this.deleteTimer = null; }
    if (this.autoResetTimer) { clearTimeout(this.autoResetTimer); this.autoResetTimer = null; }
  }
}
