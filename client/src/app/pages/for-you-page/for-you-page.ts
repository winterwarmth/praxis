import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ListingCard } from '../../shared/ui/listing-card/listing-card';

interface ForYouListing {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string | null;
  imageUrl: string | null;
  matchedCourses: { subjectCode: string; courseNumber: string }[];
}

@Component({
  selector: 'app-for-you-page',
  imports: [ListingCard, RouterLink],
  templateUrl: './for-you-page.html',
  styleUrl: './for-you-page.scss',
})
export class ForYouPage implements OnInit {
  private http = inject(HttpClient);

  readonly listings = signal<ForYouListing[]>([]);
  readonly loading = signal(true);
  readonly hasCourses = signal(true);

  ngOnInit(): void {
    this.http.get<ForYouListing[]>('/api/listings/for-you').subscribe({
      next: (listings) => {
        this.listings.set(listings);
        this.loading.set(false);
        if (listings.length === 0) {
          this.http.get<{ id: string }[]>('/api/auth/courses').subscribe({
            next: (courses) => this.hasCourses.set(courses.length > 0),
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
