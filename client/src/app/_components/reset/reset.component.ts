import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, signal, inject } from '@angular/core';
import {
  EMPTY,
  Subscription,
  catchError,
  interval,
  of,
  switchMap,
} from 'rxjs';
import { API_BASE_URL } from '../../_shared/config';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrimeNgModule } from '../../primeng.module';
import { MessageService } from 'primeng/api';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';

@Component({
    selector: 'app-reset',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PrimeNgModule,
        BackButtonComponent
    ],
    templateUrl: './reset.component.html',
    styleUrl: './reset.component.scss'
})
export class ResetComponent implements OnDestroy {
  private router = inject(Router);
  private httpClient = inject(HttpClient);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  subscriptions = new Subscription();
  confFormGroup: FormGroup;

  constructor() {
    this.confFormGroup = this.fb.group({
      deleteAllJobs: this.fb.control(false),
      closeAllXdccInstances: this.fb.control(false),
      cleanDownloads: this.fb.control(false),
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  reset() {
    const resetSub = this.httpClient
      .post(`${API_BASE_URL}/reset`, this.confFormGroup.getRawValue())
      .pipe(catchError(() => EMPTY))
      .subscribe(() =>
        this.messageService.add({ severity: 'success', summary: 'Reset completato', detail: '' })
      );
    this.subscriptions.add(resetSub);
  }
}
