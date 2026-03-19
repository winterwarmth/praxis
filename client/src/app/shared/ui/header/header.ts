import { Component, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Navbar } from '../navbar/navbar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NgIcon, Navbar],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected authService = inject(AuthService);
  private http = inject(HttpClient);
  readonly profileImageUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.http.get<{ profileImageUrl: string | null }>('/api/auth/me').subscribe({
          next: (user) => this.profileImageUrl.set(user.profileImageUrl),
          error: () => {},
        });
      } else {
        this.profileImageUrl.set(null);
      }
    });
  }

  onLogout(): void {
    this.authService.signOut();
  }
}
