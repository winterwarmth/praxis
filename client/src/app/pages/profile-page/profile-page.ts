import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ListingCard } from '../../shared/ui/listing-card/listing-card';
import { Listing, ListingService } from '../../shared/services/listing.service';
import { SupabaseService } from '../../core/services/supabase.service';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  role?: string;
  bio?: string;
  usernameChangedAt?: string | null;
  preferredPaymentMethods?: string;
}

interface CourseInfo {
  id: string;
  subjectCode: string;
  courseNumber: string;
  courseName: string;
}

interface ReviewInfo {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
  reviewerUsername: string;
}

interface ReviewsResponse {
  reviews: ReviewInfo[];
  averageRating: number;
  totalReviews: number;
}

const PAYMENT_OPTIONS = ['cash', 'cashapp', 'paypal', 'venmo', 'zelle'] as const;

@Component({
  selector: 'app-profile-page',
  imports: [NgIcon, ListingCard, FormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private listingService = inject(ListingService);
  private supabaseService = inject(SupabaseService);
  readonly isUploadingAvatar = signal(false);

  readonly profile = signal<UserProfile | null>(null);
  readonly listings = signal<Listing[]>([]);
  readonly listingFilter = signal<'active' | 'sold'>('active');
  readonly courses = signal<CourseInfo[]>([]);
  readonly allCourses = signal<CourseInfo[]>([]);
  readonly filteredCourses = signal<CourseInfo[]>([]);
  courseSearchQuery = '';
  readonly reviewsData = signal<ReviewsResponse>({ reviews: [], averageRating: 0, totalReviews: 0 });
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly usernameStatus = signal<'idle' | 'available' | 'taken' | 'same'>('idle');
  readonly canChangeUsername = signal(true);
  readonly nextUsernameChangeDate = signal('');
  readonly paymentOptions = PAYMENT_OPTIONS;

  editForm = { firstName: '', lastName: '', username: '', bio: '', preferredPaymentMethods: '' };
  editPayments: Record<string, boolean> = {};
  editCourseIds: Set<string> = new Set();
  private originalUsername = '';
  private usernameCheck$ = new Subject<string>();

  constructor() {
    this.usernameCheck$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(username =>
        this.http.get<{ available: boolean }>(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
      ),
    ).subscribe(result => {
      this.usernameStatus.set(result.available ? 'available' : 'taken');
    });
  }

  ngOnDestroy(): void {
    this.usernameCheck$.complete();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.http.get<UserProfile>('/api/auth/me').subscribe((user) => {
      this.profile.set(user);
      this.checkUsernameChangeEligibility(user);

      this.fetchListings(user.id);

      this.http.get<CourseInfo[]>('/api/auth/courses')
        .subscribe((courses) => this.courses.set(courses));

      this.http.get<ReviewsResponse>(`/api/users/${user.id}/reviews`)
        .subscribe((data) => this.reviewsData.set(data));
    });
  }

  private checkUsernameChangeEligibility(user: UserProfile): void {
    if (user.usernameChangedAt) {
      const changedAt = new Date(user.usernameChangedAt);
      const nextChange = new Date(changedAt.getTime() + 60 * 24 * 60 * 60 * 1000);
      if (new Date() < nextChange) {
        this.canChangeUsername.set(false);
        this.nextUsernameChangeDate.set(nextChange.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      }
    }
  }

  private fetchListings(userId: string): void {
    this.listingService
      .getListings({ sellerId: userId, status: this.listingFilter() })
      .subscribe((listings) => this.listings.set(listings));
  }

  setListingFilter(filter: 'active' | 'sold'): void {
    this.listingFilter.set(filter);
    const user = this.profile();
    if (user) this.fetchListings(user.id);
  }

  onUsernameInput(): void {
    if (this.editForm.username === this.originalUsername) {
      this.usernameStatus.set('same');
      return;
    }
    if (this.editForm.username.length < 2) {
      this.usernameStatus.set('idle');
      return;
    }
    this.usernameCheck$.next(this.editForm.username);
  }

  startEditing(): void {
    const user = this.profile();
    if (!user) return;
    this.editForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      bio: user.bio || '',
      preferredPaymentMethods: user.preferredPaymentMethods || '',
    };
    this.originalUsername = user.username;
    this.usernameStatus.set('same');
    this.errorMessage.set('');

    // Init payment checkboxes
    const currentMethods = (user.preferredPaymentMethods || '').split(',').filter(Boolean);
    this.editPayments = {};
    for (const method of PAYMENT_OPTIONS) {
      this.editPayments[method] = currentMethods.includes(method);
    }

    // Init course selection
    this.editCourseIds = new Set(this.courses().map(c => c.id));
    this.courseSearchQuery = '';
    this.http.get<CourseInfo[]>('/api/courses').subscribe(courses => {
      this.allCourses.set(courses);
      this.filteredCourses.set(courses);
    });

    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.errorMessage.set('');
    this.usernameStatus.set('idle');
  }

  togglePayment(method: string): void {
    this.editPayments[method] = !this.editPayments[method];
  }

  toggleCourse(courseId: string): void {
    if (this.editCourseIds.has(courseId)) {
      this.editCourseIds.delete(courseId);
    } else {
      this.editCourseIds.add(courseId);
    }
  }

  isCourseSelected(courseId: string): boolean {
    return this.editCourseIds.has(courseId);
  }

  onCourseSearch(): void {
    const q = this.courseSearchQuery.toLowerCase();
    if (!q) {
      this.filteredCourses.set(this.allCourses());
      return;
    }
    this.filteredCourses.set(
      this.allCourses().filter(c =>
        `${c.subjectCode} ${c.courseNumber}`.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q)
      )
    );
  }

  formatPaymentLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Cash', cashapp: 'Cash App', paypal: 'PayPal', venmo: 'Venmo', zelle: 'Zelle',
    };
    return labels[method] || method;
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const user = this.profile();
    if (!user) return;

    this.isUploadingAvatar.set(true);
    const supabase = this.supabaseService.getClient();
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      this.errorMessage.set('Failed to upload image.');
      this.isUploadingAvatar.set(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    this.http.put<UserProfile>('/api/auth/profile', { profileImageUrl: imageUrl }).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.isUploadingAvatar.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to save profile image.');
        this.isUploadingAvatar.set(false);
      },
    });
  }

  getStars(rating: number): string {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }

  async saveProfile(): Promise<void> {
    if (this.usernameStatus() === 'taken') {
      this.errorMessage.set('Username is taken.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    // Build payment methods string
    const selectedPayments = Object.entries(this.editPayments)
      .filter(([_, selected]) => selected)
      .map(([method]) => method)
      .join(',');

    const profileData = {
      ...this.editForm,
      preferredPaymentMethods: selectedPayments,
    };

    this.http.put<UserProfile>('/api/auth/profile', profileData).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.checkUsernameChangeEligibility(updated);

        // Update courses
        const courseIds = Array.from(this.editCourseIds);
        this.http.put<CourseInfo[]>('/api/auth/courses', courseIds).subscribe({
          next: (courses) => {
            this.courses.set(courses);
            this.isEditing.set(false);
            this.isSaving.set(false);
            this.usernameStatus.set('idle');
          },
          error: () => {
            this.isEditing.set(false);
            this.isSaving.set(false);
          },
        });
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error : 'Failed to update profile.';
        this.errorMessage.set(msg);
        this.isSaving.set(false);
      },
    });
  }
}
