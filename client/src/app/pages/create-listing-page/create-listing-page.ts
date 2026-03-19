import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

import { ListingService } from '../../shared/services/listing.service';
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
export class CreateListingPage {
  private readonly listingService = inject(ListingService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

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
                  next: () => this.router.navigate(['/listing', result.id]),
                  error: () => this.router.navigate(['/listing', result.id]),
                });
            } else {
              this.router.navigate(['/listing', result.id]);
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
}
