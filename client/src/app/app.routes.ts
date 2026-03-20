import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { LoginPage } from './pages/login-page/login-page';
import { ApplyPage } from './pages/apply-page/apply-page';

import { SavedPage } from './pages/saved-page/saved-page';
import { ForYouPage } from './pages/for-you-page/for-you-page';
import { UserPage } from './pages/user-page/user-page';
import { MessagesPage } from './pages/messages-page/messages-page';
import { MessageThreadPage } from './pages/message-thread-page/message-thread-page';
import { ListingDetailPage } from './pages/listing-detail-page/listing-detail-page';
import { CreateListingPage } from './pages/create-listing-page/create-listing-page';
import { AdminDashboardPage } from './pages/admin-dashboard-page/admin-dashboard-page';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePage, canActivate: [authGuard] },
  { path: 'login', component: LoginPage },
  { path: 'apply', component: ApplyPage },
  { path: 'saved', component: SavedPage, canActivate: [authGuard] },
  { path: 'for-you', component: ForYouPage, canActivate: [authGuard] },
  { path: 'u/:username', component: UserPage, canActivate: [authGuard] },
  { path: 'messages', component: MessagesPage, canActivate: [authGuard] },
  { path: 'messages/thread/:otherUserId/:listingId', component: MessageThreadPage, canActivate: [authGuard] },
  { path: 'listing/create', component: CreateListingPage, canActivate: [authGuard] },
  { path: 'listing/:id', component: ListingDetailPage, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardPage, canActivate: [authGuard] }
];
