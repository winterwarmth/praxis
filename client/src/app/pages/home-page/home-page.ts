import { Component } from '@angular/core';
import { SearchBar } from '../../shared/ui/search-bar/search-bar';

@Component({
  selector: 'app-home-page',
  imports: [SearchBar],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  onSearch(query: string): void {
    // TODO: implement search
  }
}
