import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { PlatformGuard } from './core/guards/platform.guard';

export const APP_ROUTES: Routes = [
  // ── Brauzer himoya sahifalari (PlatformGuard'dan chiqarilgan) ──
  {
    path: 'browser-login',
    loadChildren: () =>
      import('./features/browser-login/browser-login.module')
        .then((m) => m.BrowserLoginModule),
  },
  {
    path: 'browser-blocked',
    loadChildren: () =>
      import('./features/browser-blocked/browser-blocked.module')
        .then((m) => m.BrowserBlockedModule),
  },

  // ── Asosiy sahifalar ──
  {
    path: '',
    canActivate: [PlatformGuard, AuthGuard],
    loadChildren: () =>
      import('./features/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'search',
    canActivate: [PlatformGuard, AuthGuard],
    loadChildren: () =>
      import('./features/search/search.module').then((m) => m.SearchModule),
  },
  {
    path: 'history',
    canActivate: [PlatformGuard, AuthGuard],
    loadChildren: () =>
      import('./features/history/history.module').then((m) => m.HistoryModule),
  },
  {
    path: 'favorites',
    canActivate: [PlatformGuard, AuthGuard],
    loadChildren: () =>
      import('./features/favorites/favorites.module')
        .then((m) => m.FavoritesModule),
  },
  {
    path: 'profile',
    canActivate: [PlatformGuard, AuthGuard],
    loadChildren: () =>
      import('./features/profile/profile.module').then((m) => m.ProfileModule),
  },

  // ── Kino korish ──
  {
    path: 'watch/:id',
    canActivate: [PlatformGuard, AuthGuard],
    loadChildren: () =>
      import('./features/watch/watch.module').then((m) => m.WatchModule),
  },

  // ── Obuna va tolov ──
  {
    path: 'subscription',
    canActivate: [PlatformGuard, AuthGuard],
    loadChildren: () =>
      import('./features/subscription/subscription.module')
        .then((m) => m.SubscriptionModule),
  },

  // ── Mini dramalar (Shorts) ──
  {
    path: 'shorts',
    canActivate: [PlatformGuard, AuthGuard],
    loadChildren: () =>
      import('./features/shorts/shorts.module').then((m) => m.ShortsModule),
  },

  // ── Admin ──
  {
    path: 'admin',
    canActivate: [PlatformGuard, AuthGuard],
    data: { requireAdmin: true },
    loadChildren: () =>
      import('./features/admin/admin.module').then((m) => m.AdminModule),
  },

  { path: '**', redirectTo: '' },
];
