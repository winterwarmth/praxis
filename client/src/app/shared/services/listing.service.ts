import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ListingService {
  private http = inject(HttpClient);

  getListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>('/api/listings');
  }
}
