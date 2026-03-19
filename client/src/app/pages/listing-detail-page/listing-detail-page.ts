import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

import { SavedItemsService } from '../../shared/services/saved-items.service';
import { ListingDetail, ListingService } from '../../shared/services/listing.service';

interface SellerReviews {
  averageRating: number;
  totalReviews: number;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  cashapp: 'Cash App',
  paypal: 'PayPal',
  venmo: 'Venmo',
  zelle: 'Zelle',
};

@Component({
  selector: 'app-listing-detail-page',
  imports: [RouterLink, CurrencyPipe, NgIcon],
  templateUrl: './listing-detail-page.html',
  styleUrl: './listing-detail-page.scss',
})
export class ListingDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly savedItems = inject(SavedItemsService);
  private readonly listingService = inject(ListingService);
  private readonly http = inject(HttpClient);

  protected readonly listing = signal<ListingDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedImageIndex = signal(0);
  protected readonly sellerReviews = signal<SellerReviews | null>(null);

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
    this.savedItems.toggleSave({ id: l.id, title: l.title });
  }
}
