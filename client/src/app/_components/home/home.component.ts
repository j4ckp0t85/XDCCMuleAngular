import { CommonModule } from '@angular/common';
import {} from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';

@Component({
    selector: 'app-home',
    imports: [
        CommonModule,
        RouterOutlet,
        MaterialModule,
        RouterModule,
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {
  items = [
    { title: 'Nuova ricerca', link: '/search', icon: 'search' },
    { title: 'Downloads', link: '/downloads', icon: 'download' },
    { title: 'Istanze attive', link: '/instances', icon: 'flash_on' },
    { title: 'Reset', link: '/reset', icon: 'restart_alt' },
  ];
}
