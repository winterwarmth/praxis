import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessagesPage } from './messages-page';
import { MessagingService } from '../../shared/services/messaging.service';
import type { MessageThread } from '../../shared/services/messaging.service';

describe('MessagesPage', () => {
  let component: MessagesPage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MessagesPage,
        MessagingService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    component = TestBed.inject(MessagesPage);
  });

  describe('getThreadRoute', () => {
    it('should return route array when thread has listingId', () => {
      const thread: MessageThread = {
        id: 'msg-1',
        otherUserId: 'seller-123',
        listingId: 'listing-456',
        otherUserName: 'Jane Doe',
        itemTitle: 'Calculus Textbook',
        lastMessage: 'Hi there',
        isUnread: false,
        timestamp: '2025-01-01T12:00:00Z',
      };
      const route = (component as unknown as { getThreadRoute(t: MessageThread): string[] | null }).getThreadRoute(thread);
      expect(route).toEqual(['/messages', 'thread', 'seller-123', 'listing-456']);
    });

    it('should return null when thread has no listingId', () => {
      const thread: MessageThread = {
        id: 'msg-2',
        otherUserId: 'user-789',
        listingId: null,
        otherUserName: 'John Smith',
        itemTitle: 'Deleted Listing',
        lastMessage: 'Hello',
        isUnread: false,
        timestamp: '2025-01-01T12:00:00Z',
      };
      const route = (component as unknown as { getThreadRoute(t: MessageThread): string[] | null }).getThreadRoute(thread);
      expect(route).toBeNull();
    });
  });
});
