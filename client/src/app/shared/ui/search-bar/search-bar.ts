import { Component, input, output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  imports: [NgIcon, FormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar {
  readonly placeholder = input('Search...');
  readonly search = output<string>();
  readonly query = signal('');

  onSearch(): void {
    this.search.emit(this.query());
  }
}
