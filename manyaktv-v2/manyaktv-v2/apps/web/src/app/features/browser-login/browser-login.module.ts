import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { BrowserLoginComponent } from './browser-login.component';

const routes: Routes = [{ path: '', component: BrowserLoginComponent }];

@NgModule({
  declarations: [BrowserLoginComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class BrowserLoginModule {}
