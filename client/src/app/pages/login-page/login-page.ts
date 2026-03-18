import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  protected emailOrUsername = '';
  protected password = '';
  protected errorMessage = signal('');
  protected isSubmitting = signal(false);

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
  ) {}

  protected async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    let email = this.emailOrUsername;

    if (!email.includes('@')) {
      try {
        const result = await firstValueFrom(
          this.http.get<{ email: string }>(`/api/auth/lookup?username=${encodeURIComponent(email)}`)
        );
        email = result.email;
      } catch {
        this.errorMessage.set('Username not found. Try logging in with your email.');
        this.isSubmitting.set(false);
        return;
      }
    }

    const { error } = await this.authService.signIn(email, this.password);

    this.isSubmitting.set(false);

    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
