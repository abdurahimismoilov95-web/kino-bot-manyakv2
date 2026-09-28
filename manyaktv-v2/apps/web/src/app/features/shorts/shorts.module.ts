import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ShortsComponent } from './shorts.component';

const routes: Routes = [{ path: '', component: ShortsComponent }];

@NgModule({
  declarations: [ShortsComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class ShortsModule {}
