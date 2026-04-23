import { Component, inject, signal, afterNextRender, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { Observable } from 'rxjs';
import { MessagingService, MessageThread } from '../../shared/services/messaging.service';
import { Spinner } from '../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-messages-page',
  imports: [RouterLink, DatePipe, NgIcon, Spinner],
  templateUrl: './messages-page.html',
  styleUrl: './messages-page.scss',
})
export class MessagesPage {
  private messagingService = inject(MessagingService);
  private relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  protected threads = signal<MessageThread[]>([]);
  protected isLoading = signal(true);
  protected confirmingDeleteId = signal<string | null>(null);
  private confirmTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      this.messagingService.getThreads().subscribe({
        next: (data) => {
          this.threads.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
    });
  }

  protected getThreadRoute(thread: MessageThread): string[] | null {
    if (thread.listingId) {
      return ['/messages', 'thread', thread.otherUserId, thread.listingId];
    }
    return null;
  }

  protected toggleReadState(thread: MessageThread, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!thread.listingId) return;

    const nextState = !thread.isUnread;
    this.threads.update(list =>
      list.map(t => (t.id === thread.id ? { ...t, isUnread: nextState } : t))
    );

    const request: Observable<unknown> = nextState
      ? this.messagingService.markThreadUnread(thread.otherUserId, thread.listingId)
      : this.messagingService.markThreadRead(thread.otherUserId, thread.listingId);

    request.subscribe({
      error: () => {
        this.threads.update(list =>
          list.map(t => (t.id === thread.id ? { ...t, isUnread: !nextState } : t))
        );
      },
    });
  }

  protected onDeleteClick(id: string): void {
    if (this.confirmingDeleteId() === id) {
      this.clearConfirmTimeout();
      this.confirmingDeleteId.set(null);
      this.threads.update(currentThreads => currentThreads.filter(t => t.id !== id));
      return;
    }

    this.clearConfirmTimeout();
    this.confirmingDeleteId.set(id);
    this.confirmTimeout = setTimeout(() => {
      this.confirmingDeleteId.set(null);
      this.confirmTimeout = null;
    }, 3000);
  }

  private clearConfirmTimeout(): void {
    if (this.confirmTimeout) {
      clearTimeout(this.confirmTimeout);
      this.confirmTimeout = null;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.confirmingDeleteId()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.remove-button')) {
      this.clearConfirmTimeout();
      this.confirmingDeleteId.set(null);
    }
  }

  protected getRelativeTime(timestamp: string): string {
    const diffSec = (new Date(timestamp).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diffSec);
    const rtf = this.relativeTimeFormat;

    if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), 'day');
    if (abs < 2629800) return rtf.format(Math.round(diffSec / 604800), 'week');
    if (abs < 31557600) return rtf.format(Math.round(diffSec / 2629800), 'month');
    return rtf.format(Math.round(diffSec / 31557600), 'year');
  }
}