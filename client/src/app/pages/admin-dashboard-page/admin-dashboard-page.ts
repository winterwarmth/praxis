import { Component, inject, signal, afterNextRender, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Spinner } from '../../shared/ui/spinner/spinner';

interface BannedUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  bannedAt: string | null;
  banReason: string | null;
  joinDate: string;
  avgRatingReceived: number;
  totalReviewsReceived: number;
  activeListings: number;
  soldListings: number;
  reviewsAuthored: number;
  avgRatingGiven: number;
}

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink, Spinner, DatePipe, DecimalPipe],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss',
})
export class AdminDashboardPage {
  private http = inject(HttpClient);

  protected bannedUsers = signal<BannedUser[]>([]);
  protected loading = signal(true);
  protected unbanningId = signal<string | null>(null);
  protected confirmingUnbanId = signal<string | null>(null);
  private confirmTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => this.loadBanned());
  }

  private loadBanned(): void {
    this.loading.set(true);
    this.http.get<BannedUser[]>('/api/admin/banned-users').subscribe({
      next: (users) => {
        this.bannedUsers.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onUnbanClick(id: string): void {
    if (this.confirmingUnbanId() === id) {
      this.clearConfirmTimeout();
      this.confirmingUnbanId.set(null);
      this.unban(id);
      return;
    }

    this.clearConfirmTimeout();
    this.confirmingUnbanId.set(id);
    this.confirmTimeout = setTimeout(() => {
      this.confirmingUnbanId.set(null);
      this.confirmTimeout = null;
    }, 3000);
  }

  private unban(id: string): void {
    this.unbanningId.set(id);
    this.http.post(`/api/admin/users/${id}/unban`, {}).subscribe({
      next: () => {
        this.bannedUsers.update(list => list.filter(u => u.id !== id));
        this.unbanningId.set(null);
      },
      error: () => this.unbanningId.set(null),
    });
  }

  private clearConfirmTimeout(): void {
    if (this.confirmTimeout) {
      clearTimeout(this.confirmTimeout);
      this.confirmTimeout = null;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.confirmingUnbanId()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.unban-btn')) {
      this.clearConfirmTimeout();
      this.confirmingUnbanId.set(null);
    }
  }
}
