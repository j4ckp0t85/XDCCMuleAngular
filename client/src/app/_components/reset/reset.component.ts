import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, signal, inject } from '@angular/core';
import { EMPTY, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../_shared/config';
import { Router } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset',
  imports: [
    FormsModule,
    CheckboxModule,
    ButtonModule,
    BackButtonComponent,
    FormField
  ],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.scss',
})
export class ResetComponent {
  private readonly router = inject(Router);
  private readonly httpClient = inject(HttpClient);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal({
    deleteAllJobs: false,
    closeAllXdccInstances: false,
    cleanDownloads: false,
  });

  readonly confForm = form(this.data);

  goHome() {
    this.router.navigate(['/']);
  }

  reset() {
    this.httpClient
      .post(`${API_BASE_URL}/reset`, this.data())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => EMPTY)
      )
      .subscribe(() =>
        this.messageService.add({ severity: 'success', summary: 'Reset completato', detail: '' })
      );
  }
}
