import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SavedItemsService } from './saved-items.service';

describe('SavedItemsService', () => {
  let service: SavedItemsService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    service = new SavedItemsService();
  });

  it('should start with no saved items', () => {
    expect(service.items().length).toBe(0);
  });

  it('should add an item when toggleSave is called', () => {
    service.toggleSave({ id: '1', title: 'Test Item' });
    expect(service.items().length).toBe(1);
    expect(service.items()[0].title).toBe('Test Item');
  });

  it('should remove an item when toggleSave is called twice', () => {
    service.toggleSave({ id: '1', title: 'Test Item' });
    service.toggleSave({ id: '1', title: 'Test Item' });
    expect(service.items().length).toBe(0);
  });

  it('should correctly report if an item is saved', () => {
    expect(service.isSaved('1')).toBe(false);
    service.toggleSave({ id: '1', title: 'Test Item' });
    expect(service.isSaved('1')).toBe(true);
  });

  it('should update an existing saved item', () => {
    service.toggleSave({ id: '1', title: 'Old Title', price: 10 });
    service.update('1', { title: 'New Title', price: 25 });
    expect(service.items()[0].title).toBe('New Title');
    expect(service.items()[0].price).toBe(25);
  });

  it('should not modify other items when updating one', () => {
    service.toggleSave({ id: '1', title: 'Item 1' });
    service.toggleSave({ id: '2', title: 'Item 2' });
    service.update('1', { title: 'Updated Item 1' });
    expect(service.items().find(i => i.id === '2')?.title).toBe('Item 2');
  });

  it('should remove a specific item by id', () => {
    service.toggleSave({ id: '1', title: 'Item 1' });
    service.toggleSave({ id: '2', title: 'Item 2' });
    service.remove('1');
    expect(service.items().length).toBe(1);
    expect(service.isSaved('1')).toBe(false);
    expect(service.isSaved('2')).toBe(true);
  });

  it('should clear all saved items', () => {
    service.toggleSave({ id: '1', title: 'Item 1' });
    service.toggleSave({ id: '2', title: 'Item 2' });
    service.clear();
    expect(service.items().length).toBe(0);
  });

  it('should persist items to localStorage', () => {
    service.toggleSave({ id: '1', title: 'Persisted Item' });
    const stored = JSON.parse(localStorage.getItem('praxis_saved_items') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].title).toBe('Persisted Item');
  });

  it('should add new items to the front of the list', () => {
    service.toggleSave({ id: '1', title: 'First' });
    service.toggleSave({ id: '2', title: 'Second' });
    expect(service.items()[0].title).toBe('Second');
    expect(service.items()[1].title).toBe('First');
  });
});
