import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { APP_ROUTES } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalErrorHandler } from './core/services/global-error-handler';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [AppComponent, BottomNavComponent, SplashScreenComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule,
    RouterModule.forRoot(APP_ROUTES, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
