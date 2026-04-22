import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'home',
    renderMode: RenderMode.Client
  },
  {
    path: 'u/:username',
    renderMode: RenderMode.Client
  },
  {
    path: 'listing/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'messages',
    renderMode: RenderMode.Client
  },
  {
    path: 'messages/thread/:otherUserId/:listingId',
    renderMode: RenderMode.Client
  },
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: 'apply',
    renderMode: RenderMode.Client
  },
  {
    path: 'reset-password',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
