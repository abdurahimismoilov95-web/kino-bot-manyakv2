import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SearchComponent } from './search.component';

const routes: Routes = [{ path: '', component: SearchComponent }];

@NgModule({
  declarations: [SearchComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class SearchModule {}
