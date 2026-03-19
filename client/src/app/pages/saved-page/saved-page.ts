import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { SavedItemsService } from '../../shared/services/saved-items.service';
import { ListingCard } from '../../shared/ui/listing-card/listing-card';
import { ListingService } from '../../shared/services/listing.service';

@Component({
  selector: 'app-saved-page',
  imports: [ListingCard, NgIcon],
  templateUrl: './saved-page.html',
  styleUrl: './saved-page.scss',
})
export class SavedPage implements OnInit {
  private readonly savedItems = inject(SavedItemsService);
  private readonly listingService = inject(ListingService);

  protected readonly items = computed(() => this.savedItems.items());
  protected readonly soldIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadStatuses();
  }

  private loadStatuses(): void {
    const ids = this.items().map((i) => i.id);
    if (ids.length === 0) return;

    for (const id of ids) {
      this.listingService.getListing(id).subscribe({
        next: (listing) => {
          if (listing.status === 'sold') {
            this.soldIds.update((set) => { const s = new Set(set); s.add(id); return s; });
          }
          // Refresh saved data with latest from API
          this.savedItems.update(id, {
            title: listing.title,
            imageUrl: listing.images[0]?.imageUrl ?? null,
            price: listing.price,
            condition: listing.condition,
          });
        },
        error: () => {},
      });
    }
  }

  protected isSold(id: string): boolean {
    return this.soldIds().has(id);
  }
  protected readonly confirmingClear = signal(false);

  protected remove(event: Event, id: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.savedItems.remove(id);
  }

  private cancelTimer: ReturnType<typeof setTimeout> | null = null;
  private autoResetTimer: ReturnType<typeof setTimeout> | null = null;

  protected clearAll(): void {
    if (this.confirmingClear()) {
      this.savedItems.clear();
      this.confirmingClear.set(false);
      this.clearTimers();
    } else {
      this.confirmingClear.set(true);
      this.autoResetTimer = setTimeout(() => {
        this.confirmingClear.set(false);
        this.autoResetTimer = null;
      }, 3000);
    }
  }

  protected delayCancelClear(): void {
    this.cancelTimer = setTimeout(() => {
      this.confirmingClear.set(false);
      this.clearTimers();
    }, 1000);
  }

  protected keepConfirming(): void {
    if (this.cancelTimer) {
      clearTimeout(this.cancelTimer);
      this.cancelTimer = null;
    }
  }

  private clearTimers(): void {
    if (this.cancelTimer) { clearTimeout(this.cancelTimer); this.cancelTimer = null; }
    if (this.autoResetTimer) { clearTimeout(this.autoResetTimer); this.autoResetTimer = null; }
  }
}
