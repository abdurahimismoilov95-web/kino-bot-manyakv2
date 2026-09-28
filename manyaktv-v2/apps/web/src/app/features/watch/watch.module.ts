import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { WatchComponent } from './watch.component';
import { HlsPlayerComponent } from '../../shared/components/hls-player/hls-player.component';

const routes: Routes = [{ path: '', component: WatchComponent }];

@NgModule({
  declarations: [WatchComponent, HlsPlayerComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class WatchModule {}
