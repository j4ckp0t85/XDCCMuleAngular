import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss',
  imports: [ButtonModule],
})
export class BackButtonComponent {
  private readonly router = inject(Router);

  goHome(): void {
    this.router.navigate(['/']);
  }
}
