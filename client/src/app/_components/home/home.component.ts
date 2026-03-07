import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../_shared/_services/theme.service';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  readonly themeBase = inject(ThemeService);
  readonly dockItems = [
    {
      title: 'Downloads',
      icon: 'download',
      link: '/downloads'
    },
    {
      title: 'Istanze Server',
      icon: 'server',
      link: '/instances'
    },
    {
      title: 'Aggiornamenti',
      icon: 'bolt',
      link: '/news'
    },
    {
      title: 'Impostazioni',
      icon: 'cog',
      link: '/reset'
    }
  ];
}