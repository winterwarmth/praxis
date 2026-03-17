import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  protected email = '';
  protected password = '';

  protected onSubmit(): void {
    // TODO: implement authentication
    console.log('Login submitted', this.email);
  }
}
