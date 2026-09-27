import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminDashboardComponent } from './components/dashboard.component';
import { AdminUsersComponent } from './components/users.component';
import { AdminContentComponent } from './components/content.component';
import { AdminPaymentsComponent } from './components/payments.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users',     component: AdminUsersComponent },
      { path: 'content',  component: AdminContentComponent },
      { path: 'payments', component: AdminPaymentsComponent },
    ],
  },
];

@NgModule({
  declarations: [
    AdminComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminContentComponent,
    AdminPaymentsComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class AdminModule {}
