import { Component } from '@angular/core';
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
  constructor(protected authService: AuthService) {}

  onLogout(): void {
    this.authService.signOut();
  }
}
