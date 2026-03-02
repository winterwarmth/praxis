import { Component, inject, OnInit, signal } from '@angular/core';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { ListingCard } from '../../shared/ui/listing-card/listing-card';
import { ListingFilter } from './listing-filter/listing-filter';
import { Listing, ListingService } from '../../shared/services/listing.service';

@Component({
  selector: 'app-home-page',
  imports: [SearchBar, ListingCard, ListingFilter],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  private listingService = inject(ListingService);
  readonly listings = signal<Listing[]>([]);

  ngOnInit(): void {
    this.listingService.getListings().subscribe(data => {
      this.listings.set(data);
    });
  }

  onSearch(query: string): void {
    // TODO: implement search
  }

  onSort(sortBy: string): void {
    // TODO: implement sorting
  }

  onPriceFilter(price: { min: number | null; max: number | null }): void {
    // TODO: implement price filtering
  }

  onFilter(category: string): void {
    // TODO: implement filtering
  }

  onPaymentFilter(methods: string[]): void {
    // TODO: implement payment filtering
  }

  onCourseFilter(course: string): void {
    // TODO: implement course filtering
  }
}
