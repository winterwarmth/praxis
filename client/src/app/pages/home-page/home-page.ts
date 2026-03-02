import { Component } from '@angular/core';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';
import { ListingFilter } from './listing-filter/listing-filter';

@Component({
  selector: 'app-home-page',
  imports: [SearchBar, ListingFilter],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
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
