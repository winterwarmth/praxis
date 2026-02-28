import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { LoginPage } from './pages/login-page/login-page';
import { ApplyPage } from './pages/apply-page/apply-page';
import { ProfilePage } from './pages/profile-page/profile-page';
import { SavedPage } from './pages/saved-page/saved-page';
import { ForYouPage } from './pages/for-you-page/for-you-page';
import { UserPage } from './pages/user-page/user-page';
import { MessagesPage } from './pages/messages-page/messages-page';
import { ListingDetailPage } from './pages/listing-detail-page/listing-detail-page';
import { CreateListingPage } from './pages/create-listing-page/create-listing-page';
import { AdminDashboardPage } from './pages/admin-dashboard-page/admin-dashboard-page';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'apply', component: ApplyPage },
  { path: 'profile', component: ProfilePage },
  { path: 'saved', component: SavedPage },
  { path: 'for-you', component: ForYouPage },
  { path: 'user/:id', component: UserPage },
  { path: 'messages', component: MessagesPage },
  { path: 'listing/create', component: CreateListingPage },
  { path: 'listing/:id', component: ListingDetailPage },
  { path: 'admin', component: AdminDashboardPage }
];
