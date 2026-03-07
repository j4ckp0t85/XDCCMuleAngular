import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./_components/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./_components/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'downloads',
    loadComponent: () => import('./_components/downloadlist/downloadlist.component').then(m => m.DownloadlistComponent),
  },
  {
    path: 'instances',
    loadComponent: () => import('./_components/active-instances/active-instances.component').then(m => m.ActiveInstancesComponent),
  },
  {
    path: 'reset',
    loadComponent: () => import('./_components/reset/reset.component').then(m => m.ResetComponent),
  },
  {
    path: 'news',
    loadComponent: () => import('./_components/news/news.component').then(m => m.NewsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
