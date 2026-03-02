import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { SavedItemsService } from '../../shared/services/saved-items.service';

@Component({
  selector: 'app-listing-detail-page',
  imports: [NgIf],
  templateUrl: './listing-detail-page.html',
  styleUrl: './listing-detail-page.scss',
})
export class ListingDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly savedItems = inject(SavedItemsService);

  protected readonly listingId = signal<string | null>(null);
  protected readonly title = signal<string>('Listing');

  protected readonly isSaved = computed(() => {
    const id = this.listingId();
    if (!id) return false;
    return this.savedItems.isSaved(id);
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.listingId.set(id);
      if (id) {
        this.title.set(`Listing ${id}`);
      }
    });
  }

  protected toggleSave(): void {
    const id = this.listingId();
    if (!id) return;

    this.savedItems.toggleSave({
      id,
      title: this.title(),
    });
  }
}
