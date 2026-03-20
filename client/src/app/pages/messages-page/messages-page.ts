import { Component, inject, signal, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MessagingService, MessageThread } from '../../shared/services/messaging.service';

@Component({
  selector: 'app-messages-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './messages-page.html',
  styleUrl: './messages-page.scss',
})
export class MessagesPage {
  private messagingService = inject(MessagingService);

  protected threads = signal<MessageThread[]>([]);

  constructor() {
    afterNextRender(() => {
      this.messagingService.getThreads().subscribe({
        next: (data) => this.threads.set(data),
        error: () => {},
      });
    });
  }

  protected getThreadRoute(thread: MessageThread): string[] | null {
    if (thread.listingId) {
      return ['/messages', 'thread', thread.otherUserId, thread.listingId];
    }
    return null;
  }

  protected removeThread(id: string): void {
    this.threads.update(currentThreads => currentThreads.filter(t => t.id !== id));
  }
}