import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ListingService } from './listing.service';

describe('ListingService', () => {
  let service: ListingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ListingService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ListingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch listings with no filters', () => {
    service.getListings().subscribe((listings) => {
      expect(listings.length).toBe(1);
      expect(listings[0].title).toBe('Test Listing');
    });

    const req = httpMock.expectOne('/api/listings');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', title: 'Test Listing', price: 10, category: 'other' }]);
  });

  it('should send category and search filters as query params', () => {
    service.getListings({ search: 'book', category: 'Textbooks' }).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === '/api/listings' &&
      r.params.get('search') === 'book' &&
      r.params.get('category') === 'Textbooks'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should send price filters as query params', () => {
    service.getListings({ minPrice: 5, maxPrice: 50 }).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === '/api/listings' &&
      r.params.get('minPrice') === '5' &&
      r.params.get('maxPrice') === '50'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should send courseId filter as query param', () => {
    service.getListings({ courseId: 'abc-123' }).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === '/api/listings' &&
      r.params.get('courseId') === 'abc-123'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should fetch a single listing by id', () => {
    service.getListing('abc-123').subscribe((listing) => {
      expect(listing.title).toBe('Detail Listing');
      expect(listing.images.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/listings/abc-123');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'abc-123',
      title: 'Detail Listing',
      images: [{ id: 'img-1', imageUrl: 'http://example.com/img.jpg', displayOrder: 0 }],
      seller: null,
      courses: [],
      semesters: [],
    });
  });

  it('should create a listing with POST', () => {
    const data = { title: 'New Item', price: 20, category: 'electronics' };
    service.createListing(data).subscribe((result) => {
      expect(result.id).toBe('new-id');
    });

    const req = httpMock.expectOne('/api/listings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('New Item');
    expect(req.request.body.price).toBe(20);
    req.flush({ id: 'new-id' });
  });

  it('should update a listing with PUT', () => {
    service.updateListing('abc-123', { title: 'Updated', price: 30 }).subscribe();

    const req = httpMock.expectOne('/api/listings/abc-123');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.title).toBe('Updated');
    expect(req.request.body.price).toBe(30);
    req.flush({ id: 'abc-123' });
  });

  it('should add images to a listing', () => {
    const urls = ['http://example.com/1.jpg', 'http://example.com/2.jpg'];
    service.addListingImages('abc-123', urls).subscribe();

    const req = httpMock.expectOne('/api/listings/abc-123/images');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(urls);
    req.flush(null);
  });

  it('should set listing courses with PUT', () => {
    const courseIds = ['course-1', 'course-2'];
    service.setListingCourses('abc-123', courseIds).subscribe();

    const req = httpMock.expectOne('/api/listings/abc-123/courses');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(courseIds);
    req.flush(null);
  });

  it('should set listing semesters with PUT', () => {
    const semesterIds = ['sem-1', 'sem-2'];
    service.setListingSemesters('abc-123', semesterIds).subscribe();

    const req = httpMock.expectOne('/api/listings/abc-123/semesters');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(semesterIds);
    req.flush(null);
  });

  it('should not send category param when set to All', () => {
    service.getListings({ category: 'All' }).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url === '/api/listings' && !r.params.has('category')
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
