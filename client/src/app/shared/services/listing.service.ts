import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface ListingSeller {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  role: string;
  preferredPaymentMethods: string;
}

export interface ListingDetail {
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
  images: ListingImage[];
  seller: ListingSeller | null;
}

export interface ListingFilters {
  search?: string;
  category?: string;
  sort?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sellerId?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ListingService {
  private http = inject(HttpClient);

  getListings(filters?: ListingFilters): Observable<Listing[]> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category && filters.category !== 'All')
      params = params.set('category', filters.category);
    if (filters?.sort) params = params.set('sort', filters.sort);
    if (filters?.minPrice != null)
      params = params.set('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice != null)
      params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters?.sellerId)
      params = params.set('sellerId', filters.sellerId);
    if (filters?.status)
      params = params.set('status', filters.status);

    return this.http.get<Listing[]>('/api/listings', { params });
  }

  getListing(id: string): Observable<ListingDetail> {
    return this.http.get<ListingDetail>(`/api/listings/${id}`);
  }

  createListing(data: {
    title: string;
    description?: string;
    price: number;
    category: string;
    condition?: string;
  }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/listings', data);
  }

  addListingImages(listingId: string, imageUrls: string[]): Observable<void> {
    return this.http.post<void>(`/api/listings/${listingId}/images`, imageUrls);
  }

  updateListing(id: string, data: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    condition?: string;
    status?: string;
  }): Observable<{ id: string }> {
    return this.http.put<{ id: string }>(`/api/listings/${id}`, data);
  }
}
