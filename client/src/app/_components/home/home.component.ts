import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  items = [
    {
      title: 'Cerca',
      icon: 'search',
      link: '/search',
      description: 'Cerca file su tutti i server disponibili'
    },
    {
      title: 'Downloads',
      icon: 'download',
      link: '/downloads',
      description: 'Gestisci i tuoi download'
    },
    {
      title: 'Istanze attive',
      icon: 'hashtag',
      link: '/instances',
      description: 'Visualizza e gestisci le istanze attive'
    },
    {
      title: 'Reset',
      icon: 'eraser',
      link: '/reset',
      description: 'Reimposta le impostazioni'
    },
    {
      title: 'News',
      icon: 'receipt',
      link: '/news',
      description: 'Scopri le ultime novità e aggiornamenti'
    }
  ];
}