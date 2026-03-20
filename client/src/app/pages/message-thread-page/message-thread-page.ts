import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { MessagingService, ThreadMessage } from '../../shared/services/messaging.service';

@Component({
  selector: 'app-message-thread-page',
  imports: [RouterLink, DatePipe, FormsModule, NgIcon],
  templateUrl: './message-thread-page.html',
  styleUrl: './message-thread-page.scss',
})
export class MessageThreadPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messagingService = inject(MessagingService);

  protected messages = signal<ThreadMessage[]>([]);
  protected otherUserName = signal<string>('');
  protected listingTitle = signal<string>('');
  protected newMessage = '';
  protected sending = signal(false);
  protected loading = signal(true);
  protected currentUserId = signal<string | null>(null);

  private otherUserId = '';
  private listingId = '';

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

  private loadThread(): void {
    this.loading.set(true);
    this.messagingService.getThreadMessages(this.otherUserId, this.listingId).subscribe({
      next: (response) => {
        this.messages.set(response.messages);
        this.otherUserName.set(response.otherUserName);
        this.listingTitle.set(response.listingTitle);
        this.loading.set(false);
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
        this.loadThread();
      },
      error: () => this.sending.set(false),
    });
  }

  protected isFromMe(msg: ThreadMessage): boolean {
    return msg.receiverId === this.otherUserId;
  }
}
