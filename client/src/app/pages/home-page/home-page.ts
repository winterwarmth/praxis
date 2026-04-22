import { Component, inject, OnInit, signal } from '@angular/core';
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
  readonly listings = signal<Listing[]>([]);
  readonly loading = signal(true);

  private search = signal('');
  private sort = signal('price-low');
  private category = signal('All');
  private priceMin = signal<number | null>(null);
  private priceMax = signal<number | null>(null);
  private courseId = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchListings();
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
    // Not implemented yet — no backend field
  }

  onCourseFilter(courseId: string): void {
    this.courseId.set(courseId || null);
    this.fetchListings();
  }

  private fetchListings(): void {
    this.loading.set(true);
    this.listingService
      .getListings({
        search: this.search(),
        category: this.category(),
        sort: this.sort(),
        minPrice: this.priceMin(),
        maxPrice: this.priceMax(),
        courseId: this.courseId() || undefined,
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
