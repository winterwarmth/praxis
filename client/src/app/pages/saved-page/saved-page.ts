import { Component, computed, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SavedItemsService } from '../../shared/services/saved-items.service';

@Component({
  selector: 'app-saved-page',
  imports: [NgIf, NgFor, RouterLink],
  templateUrl: './saved-page.html',
  styleUrl: './saved-page.scss',
})
export class SavedPage {
  private readonly savedItems = inject(SavedItemsService);

  protected readonly items = computed(() => this.savedItems.items());

  protected remove(id: string): void {
    this.savedItems.remove(id);
  }

  protected clearAll(): void {
    this.savedItems.clear();
  }
}
