import { Component, inject, OnInit, signal } from '@angular/core';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { ListingCard } from '../../shared/ui/listing-card/listing-card';
import { Listing, ListingService } from '../../shared/services/listing.service';

@Component({
  selector: 'app-home-page',
  imports: [SearchBar, ListingCard],
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
}
