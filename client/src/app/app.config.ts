import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import { lucideArrowLeft, lucideBell, lucideBookmark, lucideCamera, lucideCircleUserRound, lucideGraduationCap, lucideHome, lucideLeaf, lucideLogOut, lucideMailbox, lucideMenu, lucideMessageCircle, lucidePlusCircle, lucidePocket, lucideSearch, lucideSend, lucideX } from '@ng-icons/lucide';

import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideNgIconsConfig({}),
    provideIcons({ lucideArrowLeft, lucideBell, lucideBookmark, lucideCamera, lucideCircleUserRound, lucideGraduationCap, lucideHome, lucideLeaf, lucideLogOut, lucideMailbox, lucideMenu, lucideMessageCircle, lucidePlusCircle, lucidePocket, lucideSearch, lucideSend, lucideX })
  ]
};
