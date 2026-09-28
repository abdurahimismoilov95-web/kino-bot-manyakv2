import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SubscriptionComponent } from './subscription.component';

const routes: Routes = [{ path: '', component: SubscriptionComponent }];

@NgModule({
  declarations: [SubscriptionComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class SubscriptionModule {}
