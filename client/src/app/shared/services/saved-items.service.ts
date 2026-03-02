import { Injectable, computed, signal } from '@angular/core';

export interface SavedItem {
  id: string;
  title: string;
  description?: string;
}

const STORAGE_KEY = 'praxis_saved_items';

@Injectable({
  providedIn: 'root',
})
export class SavedItemsService {
  private readonly _items = signal<SavedItem[]>(this.loadInitial());

  readonly items = computed(() => this._items());

  isSaved = (id: string): boolean => {
    return this._items().some((item) => item.id === id);
  };

  toggleSave(item: SavedItem): void {
    if (this.isSaved(item.id)) {
      this._items.update((items) => items.filter((i) => i.id !== item.id));
    } else {
      this._items.update((items) => [item, ...items]);
    }
    this.persist();
  }

  remove(id: string): void {
    this._items.update((items) => items.filter((i) => i.id !== id));
    this.persist();
  }

  clear(): void {
    this._items.set([]);
    this.persist();
  }

  private loadInitial(): SavedItem[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedItem[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => !!item && typeof item.id === 'string' && typeof item.title === 'string');
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
    } catch {
      // ignore persistence errors
    }
  }
}

