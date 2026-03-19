import { Component, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-apply-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './apply-page.html',
  styleUrl: './apply-page.scss',
})
export class ApplyPage implements OnDestroy {
  protected firstName = '';
  protected lastName = '';
  protected email = '';
  protected username = '';
  protected password = '';
  protected confirmPassword = '';
  protected errorMessage = signal('');
  protected successMessage = signal('');
  protected isSubmitting = signal(false);
  protected usernameStatus = signal<'idle' | 'checking' | 'available' | 'taken'>('idle');
  protected rateLimitRemaining = signal(0);

  private usernameCheck$ = new Subject<string>();
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {
    this.usernameCheck$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(username =>
        this.http.get<{ available: boolean }>(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
      ),
    ).subscribe(result => {
      this.usernameStatus.set(result.available ? 'available' : 'taken');
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  protected onUsernameInput(): void {
    if (this.username.length < 2) {
      this.usernameStatus.set('idle');
      return;
    }
    this.usernameStatus.set('checking');
    this.usernameCheck$.next(this.username);
  }

  private startCountdown(seconds: number): void {
    this.rateLimitRemaining.set(seconds);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      const remaining = this.rateLimitRemaining() - 1;
      this.rateLimitRemaining.set(remaining);
      if (remaining <= 0) {
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
        this.errorMessage.set('');
      }
    }, 1000);
  }

  protected formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  protected async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    if (!this.email.endsWith('.edu')) {
      this.errorMessage.set('Please use a valid .edu email address.');
      this.isSubmitting.set(false);
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      this.isSubmitting.set(false);
      return;
    }

    if (this.usernameStatus() === 'taken') {
      this.errorMessage.set('Username is already taken.');
      this.isSubmitting.set(false);
      return;
    }

    try {
      const { data, error } = await this.authService.signUp(this.email, this.password, {
        firstName: this.firstName,
        lastName: this.lastName,
        username: this.username,
      });

      this.isSubmitting.set(false);
      if (error) {
        if (error.status === 429) {
          const seconds = (error as any).retryAfterSeconds || 60;
          this.errorMessage.set(`Email rate limit reached. Try again in ${this.formatTime(seconds)}.`);
          this.startCountdown(seconds);
        } else {
          this.errorMessage.set(error.message);
        }
      } else if (!data?.user) {
        this.errorMessage.set('Registration failed. Please try again later.');
      } else {
        this.successMessage.set('Check your email for a verification link to complete your registration.');
      }
    } catch {
      this.isSubmitting.set(false);
      this.errorMessage.set('Something went wrong. Please try again later.');
    }
  }
}
