import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPage {
  protected newPassword = '';
  protected confirmPassword = '';
  protected errorMessage = signal('');
  protected successMessage = signal('');
  protected isSubmitting = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  protected async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.newPassword.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);
    const { error } = await this.authService.updatePassword(this.newPassword);
    this.isSubmitting.set(false);

    if (error) {
      this.errorMessage.set(error.message);
      return;
    }

    this.successMessage.set('Password updated. Redirecting to login...');
    await this.authService.signOut();
    setTimeout(() => this.router.navigate(['/login']), 1500);
  }
}
