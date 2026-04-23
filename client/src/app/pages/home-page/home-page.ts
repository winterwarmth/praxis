import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { ListingCard } from '../../shared/ui/listing-card/listing-card';
import { ListingFilter } from './listing-filter/listing-filter';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { Listing, ListingService } from '../../shared/services/listing.service';

@Component({
  selector: 'app-home-page',
  imports: [SearchBar, ListingCard, ListingFilter, Spinner],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  private listingService = inject(ListingService);
  private http = inject(HttpClient);
  readonly listings = signal<Listing[]>([]);
  readonly loading = signal(true);
  readonly initialPayments = signal<string[]>([]);

  private search = signal('');
  private sort = signal('price-low');
  private category = signal('All');
  private priceMin = signal<number | null>(null);
  private priceMax = signal<number | null>(null);
  private courseId = signal<string | null>(null);
  private minCondition = signal<string>('');
  private freeOnly = signal(false);
  private payments = signal<string[]>([]);

  ngOnInit(): void {
    this.http.get<{ autoPaymentFilter: boolean; preferredPaymentMethods: string }>('/api/auth/me').subscribe({
      next: (me) => {
        if (me.autoPaymentFilter && me.preferredPaymentMethods) {
          const methods = me.preferredPaymentMethods.split(',').map(m => m.trim()).filter(Boolean);
          if (methods.length > 0) {
            this.payments.set(methods);
            this.initialPayments.set(methods);
          }
        }
        this.fetchListings();
      },
      error: () => this.fetchListings(),
    });
  }

  onSearch(query: string): void {
    this.search.set(query);
    this.fetchListings();
  }

  onSort(sortBy: string): void {
    this.sort.set(sortBy);
    this.fetchListings();
  }

  onFilter(category: string): void {
    this.category.set(category);
    this.fetchListings();
  }

  onPriceFilter(price: { min: number | null; max: number | null }): void {
    this.priceMin.set(price.min);
    this.priceMax.set(price.max);
    this.fetchListings();
  }

  onPaymentFilter(methods: string[]): void {
    this.payments.set(methods);
    this.fetchListings();
  }

  onCourseFilter(courseId: string): void {
    this.courseId.set(courseId || null);
    this.fetchListings();
  }

  onConditionFilter(minCondition: string): void {
    this.minCondition.set(minCondition);
    this.fetchListings();
  }

  onFreeOnlyFilter(freeOnly: boolean): void {
    this.freeOnly.set(freeOnly);
    this.fetchListings();
  }

  private fetchListings(): void {
    this.loading.set(true);
    const free = this.freeOnly();
    this.listingService
      .getListings({
        search: this.search(),
        category: this.category(),
        sort: this.sort(),
        minPrice: free ? 0 : this.priceMin(),
        maxPrice: free ? 0 : this.priceMax(),
        courseId: this.courseId() || undefined,
        minCondition: this.minCondition() || undefined,
        payments: this.payments(),
      })
      .subscribe({
        next: (data) => {
          this.listings.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
