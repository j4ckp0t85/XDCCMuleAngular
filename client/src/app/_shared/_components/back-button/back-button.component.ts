import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss'],
  standalone: true,
  imports: [ButtonModule]
})
export class BackButtonComponent {
  private router = inject(Router);

  goHome() {
    this.router.navigate(['/']);
  }

}