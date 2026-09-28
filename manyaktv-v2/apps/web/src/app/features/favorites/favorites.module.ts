import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FavoritesComponent } from './favorites.component';

const routes: Routes = [{ path: '', component: FavoritesComponent }];

@NgModule({
  declarations: [FavoritesComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
})
export class FavoritesModule {}
