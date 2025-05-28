import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss'],
  imports: [ButtonModule]
})
export class BackButtonComponent {

  constructor(private router: Router) { }

  goHome() {
    this.router.navigate(['/']);
  }

}