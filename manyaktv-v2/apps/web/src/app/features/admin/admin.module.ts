import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminDashboardComponent } from './components/dashboard.component';
import { AdminStatsComponent } from './components/stats.component';
import { AdminUsersComponent } from './components/users.component';
import { AdminContentComponent } from './components/content.component';
import { AdminPaymentsComponent } from './components/payments.component';
import { AdminCatalogsComponent } from './components/catalogs.component';
import { AdminPlansComponent } from './components/plans.component';
import { AdminPromosComponent } from './components/promos.component';
import { AdminBroadcastComponent } from './components/broadcast.component';
import { AdminSettingsComponent } from './components/settings.component';
import { AdminAuditComponent } from './components/audit.component';
import { AdminAdminsComponent } from './components/admins.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'content', component: AdminContentComponent },
      { path: 'payments', component: AdminPaymentsComponent },
      { path: 'catalogs', component: AdminCatalogsComponent },
      { path: 'plans', component: AdminPlansComponent },
      { path: 'promos', component: AdminPromosComponent },
      { path: 'admins', component: AdminAdminsComponent },
      { path: 'audit', component: AdminAuditComponent },
      { path: 'broadcast', component: AdminBroadcastComponent },
      { path: 'settings', component: AdminSettingsComponent },
    ],
  },
];

@NgModule({
  declarations: [
    AdminComponent,
    AdminDashboardComponent,
    AdminStatsComponent,
    AdminUsersComponent,
    AdminContentComponent,
    AdminPaymentsComponent,
    AdminCatalogsComponent,
    AdminPlansComponent,
    AdminPromosComponent,
    AdminBroadcastComponent,
    AdminSettingsComponent,
    AdminAuditComponent,
    AdminAdminsComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class AdminModule {}
