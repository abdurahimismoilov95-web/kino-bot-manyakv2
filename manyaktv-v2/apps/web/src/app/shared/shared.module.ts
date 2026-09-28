import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from './components/header/header.component';
import { HeroSliderComponent } from './components/hero-slider/hero-slider.component';
import { ContentCardComponent } from './components/content-card/content-card.component';
import { ContentDetailsComponent } from './components/content-details/content-details.component';
import { SkeletonCardComponent } from './components/skeleton/skeleton-card.component';
import { DailyCheckinComponent } from './components/daily-checkin/daily-checkin.component';

const SHARED = [
  HeaderComponent,
  HeroSliderComponent,
  ContentCardComponent,
  ContentDetailsComponent,
  SkeletonCardComponent,
  DailyCheckinComponent,
];

@NgModule({
  declarations: SHARED,
  imports: [CommonModule, RouterModule],
  exports: SHARED,
})
export class SharedModule {}
