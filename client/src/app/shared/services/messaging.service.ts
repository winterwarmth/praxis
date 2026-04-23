import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface MessageThread {
  id: string;
  otherUserId: string;
  listingId: string | null;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  otherUserRole: string;
  otherUserIsBanned: boolean;
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
  otherUserHandle: string | null;
  otherUserAvatarUrl: string | null;
  otherUserRole: string;
  otherUserIsBanned: boolean;
  listingTitle: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private http = inject(HttpClient);

  readonly unreadCount = signal(0);

  getThreads(): Observable<MessageThread[]> {
    return this.http.get<MessageThread[]>('/api/messages').pipe(
      tap(threads => this.unreadCount.set(threads.filter(t => t.isUnread).length))
    );
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

  markThreadRead(otherUserId: string, listingId: string): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>('/api/messages/thread/mark-read', {
      otherUserId,
      listingId,
    }).pipe(
      tap(res => {
        if (res.updated > 0) {
          this.unreadCount.update(n => Math.max(0, n - 1));
        }
      })
    );
  }

  markThreadUnread(otherUserId: string, listingId: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/messages/thread/mark-unread', {
      otherUserId,
      listingId,
    }).pipe(
      tap(() => this.unreadCount.update(n => n + 1))
    );
  }
}