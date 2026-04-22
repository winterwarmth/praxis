import { Component, inject, signal, OnInit, computed, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { MessagingService, ThreadMessage } from '../../shared/services/messaging.service';
import { Spinner } from '../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-message-thread-page',
  imports: [RouterLink, DatePipe, FormsModule, NgIcon, Spinner],
  templateUrl: './message-thread-page.html',
  styleUrl: './message-thread-page.scss',
})
export class MessageThreadPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messagingService = inject(MessagingService);

  protected messages = signal<ThreadMessage[]>([]);
  protected otherUserName = signal<string>('');
  protected otherUserHandle = signal<string | null>(null);
  protected otherUserAvatarUrl = signal<string | null>(null);
  protected otherUserRole = signal<string>('student');
  protected listingTitle = signal<string>('');
  protected newMessage = '';
  protected sending = signal(false);
  protected loading = signal(true);
  protected currentUserId = signal<string | null>(null);

  private otherUserId = '';
  protected listingId = '';
  private composeTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('composeTextarea');

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const otherUserId = params.get('otherUserId');
      const listingId = params.get('listingId');
      if (otherUserId && listingId) {
        this.otherUserId = otherUserId;
        this.listingId = listingId;
        this.loadThread();
      } else {
        this.router.navigate(['/messages']);
      }
    });
  }

  private loadThread(showLoadingState = true): void {
    if (showLoadingState) this.loading.set(true);
    this.messagingService.getThreadMessages(this.otherUserId, this.listingId).subscribe({
      next: (response) => {
        this.messages.set(response.messages);
        this.otherUserName.set(response.otherUserName);
        this.otherUserHandle.set(response.otherUserHandle);
        this.otherUserAvatarUrl.set(response.otherUserAvatarUrl);
        this.otherUserRole.set(response.otherUserRole);
        this.listingTitle.set(response.listingTitle);
        this.loading.set(false);
        this.messagingService.markThreadRead(this.otherUserId, this.listingId).subscribe({
          error: () => {},
        });
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/messages']);
      },
    });
  }

  protected sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || this.sending()) return;

    this.sending.set(true);
    this.messagingService.sendMessage(this.otherUserId, this.listingId, content).subscribe({
      next: () => {
        this.newMessage = '';
        this.sending.set(false);
        this.resizeTextarea();
        this.loadThread(false);
      },
      error: () => this.sending.set(false),
    });
  }

  protected onTextareaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  protected resizeTextarea(): void {
    const el = this.composeTextarea()?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  protected isFromMe(msg: ThreadMessage): boolean {
    return msg.receiverId === this.otherUserId;
  }

  private readonly dayPalette = ['#9EE6C1', '#B8A7E8', '#FFB88C', '#E8A7D4', '#FFD580', '#7AD4D6'];

  protected groupedMessages = computed(() => {
    const groups: { label: string; color: string; messages: ThreadMessage[] }[] = [];
    for (const msg of this.messages()) {
      const label = this.getDayLabel(msg.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.messages.push(msg);
      } else {
        const color = this.dayPalette[groups.length % this.dayPalette.length];
        groups.push({ label, color, messages: [msg] });
      }
    }
    return groups;
  });

  private getDayLabel(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    }
    const sameYear = date.getFullYear() === now.getFullYear();
    return sameYear
      ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
