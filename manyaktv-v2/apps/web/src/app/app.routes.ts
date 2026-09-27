import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { PlatformGuard } from './core/guards/platform.guard';

export const APP_ROUTES: Routes = [
  { path: 'browser-login', loadChildren: () => import('./features/browser-login/browser-login.module').then((m) => m.BrowserLoginModule) },
  { path: 'browser-blocked', loadChildren: () => import('./features/browser-blocked/browser-blocked.module').then((m) => m.BrowserBlockedModule) },
  { path: '', canActivate: [PlatformGuard, AuthGuard], loadChildren: () => import('./features/home/home.module').then((m) => m.HomeModule) },
  { path: 'search', canActivate: [PlatformGuard, AuthGuard], loadChildren: () => import('./features/search/search.module').then((m) => m.SearchModule) },
  { path: 'history', canActivate: [PlatformGuard, AuthGuard], loadChildren: () => import('./features/history/history.module').then((m) => m.HistoryModule) },
  { path: 'favorites', canActivate: [PlatformGuard, AuthGuard], loadChildren: () => import('./features/favorites/favorites.module').then((m) => m.FavoritesModule) },
  { path: 'profile', canActivate: [PlatformGuard, AuthGuard], loadChildren: () => import('./features/profile/profile.module').then((m) => m.ProfileModule) },
  { path: 'admin', canActivate: [PlatformGuard, AuthGuard], data: { requireAdmin: true }, loadChildren: () => import('./features/admin/admin.module').then((m) => m.AdminModule) },
  { path: '**', redirectTo: '' },
];
