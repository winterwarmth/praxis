import { Component, effect, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Navbar } from '../navbar/navbar';
import { AuthService } from '../../../core/services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { SavedItemsService } from '../../services/saved-items.service';
import { ListingService } from '../../services/listing.service';

export interface AppNotification {
  id: string;
  message: string;
  link: string;
  isRead: boolean;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgIcon, Navbar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected authService = inject(AuthService);
  private http = inject(HttpClient);
  private messagingService = inject(MessagingService);
  private savedItemsService = inject(SavedItemsService);
  private listingService = inject(ListingService);

  readonly profileImageUrl = signal<string | null>(null);
  readonly unreadMessageCount = signal(0);
  
  readonly notifications = signal<AppNotification[]>([]);
  readonly showNotifications = signal(false);
  readonly unreadNotificationCount = computed(() => 
    this.notifications().filter(n => !n.isRead).length
  );

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.http.get<{ profileImageUrl: string | null }>('/api/auth/me').subscribe({
          next: (user) => this.profileImageUrl.set(user.profileImageUrl),
          error: () => {},
        });
        this.loadMessages();
        this.checkSavedItems();
      } else {
        this.profileImageUrl.set(null);
        this.unreadMessageCount.set(0);
        this.notifications.set([]);
      }
    });
  }

  loadMessages(): void {
    this.messagingService.getThreads().subscribe(threads => {
      const count = threads.filter(t => t.isUnread).length;
      this.unreadMessageCount.set(count);
    });
  }

  checkSavedItems(): void {
    const savedItems = this.savedItemsService.items();
    savedItems.forEach(item => {
      this.listingService.getListing(item.id).subscribe({
        next: (listing) => {
          // Compare status to generate notification
          if (item.status && item.status !== listing.status) {
            const actionText = listing.status === 'sold' ? 'has been sold' : 'is active again';
            this.notifications.update(n => [
              {
                id: Date.now().toString() + item.id,
                message: `Saved item "${listing.title}" ${actionText}.`,
                link: `/listing/${listing.id}`,
                isRead: false
              },
              ...n
            ]);
          }
          // Sync the local saved item status with the DB
          if (item.status !== listing.status) {
            this.savedItemsService.update(item.id, { status: listing.status });
          }
        },
        error: () => {} 
      });
    });
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    // Mark as read when opened
    if (this.showNotifications()) {
      this.notifications.update(n => n.map(notif => ({ ...notif, isRead: true })));
    }
  }

  onLogout(): void {
    this.authService.signOut();
  }
}