import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `<span class="spinner" [style.--spinner-size]="size()" role="status" [attr.aria-label]="label()"></span>`,
  styleUrl: './spinner.scss',
})
export class Spinner {
  readonly size = input<string>('2.5rem');
  readonly label = input<string>('Loading');
}
