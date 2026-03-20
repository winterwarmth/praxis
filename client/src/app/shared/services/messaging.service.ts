import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface MessageThread {
  id: string;
  otherUserId: string;
  listingId: string | null;
  otherUserName: string;
  itemTitle: string;
  lastMessage: string;
  isUnread: boolean;
  timestamp: string;
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
  listingTitle: string | null;
}

export interface ThreadResponse {
  messages: ThreadMessage[];
  otherUserName: string;
  listingTitle: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private http = inject(HttpClient);

  getThreads(): Observable<MessageThread[]> {
    return this.http.get<MessageThread[]>('/api/messages');
  }

  getThreadMessages(otherUserId: string, listingId: string): Observable<ThreadResponse> {
    const params = new HttpParams()
      .set('otherUserId', otherUserId)
      .set('listingId', listingId);
    return this.http.get<ThreadResponse>('/api/messages/thread', { params });
  }

  sendMessage(receiverId: string, listingId: string | null, content: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/messages', {
      receiverId,
      listingId,
      content,
    });
  }
}