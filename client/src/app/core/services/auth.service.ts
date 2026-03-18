import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';
import type { User, Session } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentSession = signal<Session | null>(null);
  private loading = signal(true);

  readonly user = this.currentUser.asReadonly();
  readonly session = this.currentSession.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentSession());
  readonly isLoading = this.loading.asReadonly();

  private supabase;
  private initialHash = typeof window !== 'undefined' ? window.location.hash : '';

  constructor(
    private supabaseService: SupabaseService,
    private http: HttpClient,
    private router: Router,
  ) {
    this.supabase = this.supabaseService.getClient();
    this.initAuthListener();
  }

  private initAuthListener(): void {
    // onAuthStateChange handles all auth events including confirmation link tokens
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
      this.loading.set(false);

      if (_event === 'SIGNED_IN' && session) {
        this.syncUser();

        if (this.initialHash.includes('access_token')) {
          this.initialHash = '';
          this.router.navigate(['/home']);
        }
      }
    });

    // getSession() resolves loading for normal page loads (no hash tokens)
    // onAuthStateChange will override if it fires with a different result
    if (!this.initialHash.includes('access_token')) {
      this.supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (this.loading()) {
          this.currentSession.set(session);
          this.currentUser.set(session?.user ?? null);
          this.loading.set(false);

          if (session) {
            this.syncUser();
          }
        }
      });
    }
  }

  private async syncUser(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/sync', {}));
    } catch (err: any) {
      console.error('Failed to sync user with backend', err?.status, err?.error);
    }
  }

  async signUp(email: string, password: string, metadata: { firstName: string; lastName: string; username: string }) {
    const response = await fetch(`${environment.supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': environment.supabaseKey,
      },
      body: JSON.stringify({
        email,
        password,
        data: {
          first_name: metadata.firstName,
          last_name: metadata.lastName,
          username: metadata.username,
        },
      }),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
      return { data: null, error: { message: 'Email rate limit reached.', status: 429, retryAfterSeconds: seconds } as any };
    }

    const body = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: body.msg || body.message || 'Registration failed.', status: response.status, code: body.code } as any };
    }

    return { data: { user: body }, error: null };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (!error) {
      this.router.navigate(['/login']);
    }
    return { error };
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
}
