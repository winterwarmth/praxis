import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageThreadPage } from './message-thread-page';
import { MessagingService } from '../../shared/services/messaging.service';
import type { ThreadMessage } from '../../shared/services/messaging.service';
import { of } from 'rxjs';

describe('MessageThreadPage', () => {
  let component: MessageThreadPage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MessageThreadPage,
        MessagingService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              new Map([
                ['otherUserId', 'seller-abc'],
                ['listingId', 'listing-xyz'],
              ])
            ),
          },
        },
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    });
    component = TestBed.inject(MessageThreadPage);
  });

  describe('isFromMe', () => {
    it('should return true when message was sent by current user (receiver is the other party)', () => {
      // Set up: we're viewing a thread with seller-abc as the other user
      (component as any).otherUserId = 'seller-abc';
      const msg: ThreadMessage = {
        id: 'm1',
        senderId: 'me-123',
        receiverId: 'seller-abc',
        content: 'Hi, I am interested',
        isRead: true,
        createdAt: '2025-01-01T12:00:00Z',
        senderName: 'Me',
        listingTitle: 'Textbook',
      };
      expect((component as unknown as { isFromMe(m: ThreadMessage): boolean }).isFromMe(msg)).toBe(true);
    });

    it('should return false when message was received from the other party', () => {
      (component as any).otherUserId = 'seller-abc';
      const msg: ThreadMessage = {
        id: 'm2',
        senderId: 'seller-abc',
        receiverId: 'me-123',
        content: 'Sure, it is still available',
        isRead: true,
        createdAt: '2025-01-01T12:05:00Z',
        senderName: 'Jane Doe',
        listingTitle: 'Textbook',
      };
      expect((component as unknown as { isFromMe(m: ThreadMessage): boolean }).isFromMe(msg)).toBe(false);
    });
  });
});
