import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { HistoryComponent } from './history.component';

const routes: Routes = [{ path: '', component: HistoryComponent }];

@NgModule({
  declarations: [HistoryComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
})
export class HistoryModule {}
