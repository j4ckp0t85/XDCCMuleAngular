import { ResetComponent } from './_components/reset/reset.component';
import { Routes } from '@angular/router';
import { SearchComponent } from './_components/search/search.component';
import { HomeComponent } from './_components/home/home.component';
import { DownloadlistComponent } from './_components/downloadlist/downloadlist.component';
import { ActiveInstancesComponent } from './_components/active-instances/active-instances.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'search',
    component: SearchComponent,
  },
  {
    path: 'downloads',
    component: DownloadlistComponent,
  },
  {
    path: 'instances',
    component: ActiveInstancesComponent,
  },
  {
    path: 'reset',
    component: ResetComponent,
  },
  {
    path: '**',
    component: HomeComponent,
  },
];
