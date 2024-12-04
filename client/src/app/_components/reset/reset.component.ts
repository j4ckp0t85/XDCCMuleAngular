import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatTableResponsiveDirective } from '../../_shared/_directive/material-table-responsive.directive';
import { MaterialModule } from '../../material.module';
import { Router } from '@angular/router';
import { EMPTY, Subscription, catchError } from 'rxjs';
import { API_BASE_URL } from '../../_shared/config';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ConfForm {
  deleteAllJobs: boolean;
  closeAllXdccInstances: boolean;
  cleanDownloads: boolean;
}

@Component({
    selector: 'app-reset',
    imports: [
        MaterialModule,
        CommonModule,
        ReactiveFormsModule,
        MatTableResponsiveDirective,
    ],
    templateUrl: './reset.component.html',
    styleUrl: './reset.component.scss'
})
export class ResetComponent implements OnDestroy {
  confFormGroup!: FormGroup;
  suscriptions = new Subscription();
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private httpClient: HttpClient,
    private snackbar: MatSnackBar
  ) {
    this.confFormGroup = this.fb.group({
      deleteAllJobs: this.fb.control(false),
      closeAllXdccInstances: this.fb.control(false),
      cleanDownloads: this.fb.control(false),
    });
  }

  ngOnDestroy(): void {
    this.suscriptions.unsubscribe();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  reset() {
    const resetSub = this.httpClient
      .post(`${API_BASE_URL}/reset`, this.confFormGroup.getRawValue())
      .pipe(catchError(() => EMPTY))
      .subscribe(() =>
        this.snackbar.open('Reset completato', undefined, { duration: 3000 })
      );
    this.suscriptions.add(resetSub);
  }
}
