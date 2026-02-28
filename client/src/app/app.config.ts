import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import { lucideBell, lucideCircleUserRound, lucideGraduationCap, lucideHome, lucideLeaf, lucideMenu, lucideMessageCircle, lucidePocket, lucideSearch, lucideX } from '@ng-icons/lucide';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideNgIconsConfig({}),
    provideIcons({ lucideBell, lucideCircleUserRound, lucideGraduationCap, lucideHome, lucideLeaf, lucideMenu, lucideMessageCircle, lucidePocket, lucideSearch, lucideX })
  ]
};
