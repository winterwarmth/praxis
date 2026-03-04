import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface MessageThread {
  id: string;
  otherUserName: string;
  itemTitle: string;
  lastMessage: string;
  isUnread: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private http = inject(HttpClient);

  getThreads(userId: string): Observable<MessageThread[]> {
    return this.http.get<MessageThread[]>(`/api/messages/${userId}`);
  }
}