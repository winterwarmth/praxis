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
    // This ensures the HTTP request is completely ignored by the Node SSR server 
    // and only fires once the page loads in the client's browser.
    afterNextRender(() => {
      const currentUserId = 'a1111111-1111-1111-1111-111111111111'; 
      
      this.messagingService.getThreads(currentUserId).subscribe(data => {
        this.threads.set(data);
      });
    });
  }

  protected removeThread(id: string): void {
    this.threads.update(currentThreads => currentThreads.filter(t => t.id !== id));
  }
}