import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-listing-card',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './listing-card.html',
  styleUrl: './listing-card.scss',
})
export class ListingCard {
  readonly id = input.required<string>();
  readonly title = input.required<string>();
  readonly price = input.required<number>();
  readonly category = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly condition = input<string | null>(null);
  readonly sellerName = input<string | null>(null);
}
