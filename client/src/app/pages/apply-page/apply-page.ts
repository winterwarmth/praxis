import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-apply-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './apply-page.html',
  styleUrl: './apply-page.scss',
})
export class ApplyPage {
  protected firstName = '';
  protected lastName = '';
  protected email = '';
  protected username = '';
  protected password = '';

  protected onSubmit(): void {
    // TODO: implement application submission
    console.log('Application submitted', this.email);
  }
}
