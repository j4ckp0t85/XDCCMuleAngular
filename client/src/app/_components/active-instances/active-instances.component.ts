import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  EMPTY,
  Subscription,
  catchError,
  interval,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { API_BASE_URL } from '../../_shared/config';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableResponsiveDirective } from '../../_shared/_directive/material-table-responsive.directive';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-active-instances',
    imports: [
        MaterialModule,
        CommonModule,
        FormsModule,
        MatTableResponsiveDirective,
    ],
    templateUrl: './active-instances.component.html',
    styleUrl: './active-instances.component.scss'
})
export class ActiveInstancesComponent implements OnInit, OnDestroy {
  isFetching = signal(true);
  activeNetworks!: { network: string }[];
  subscriptions = new Subscription();
  displayedColumns = ['network', 'action'];

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchDatas();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private fetchDatas() {
    this.isFetching.set(true);
    const instancesSub = interval(1000)
      .pipe(
        switchMap(() => {
          return this.httpClient
            .get<string[]>(`${API_BASE_URL}/activeinstances`)
            .pipe(catchError(() => of([])));
        })
      )
      .subscribe((list) => {
        this.isFetching.set(false);
        if (!list) {
          return;
        }
        if (list.length === 0) {
          this.activeNetworks = [];
          return;
        }
        this.activeNetworks = list.map((x) => {
          return { network: x };
        });
      });
    this.subscriptions.add(instancesSub);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  quitInstance(network: string) {
    const quitSub = this.httpClient
      .post(`${API_BASE_URL}/quitinstance`, { network })
      .pipe(catchError(() => EMPTY))
      .subscribe(() =>
        this.snackBar.open(`Network ${network} rimosso`, undefined, {
          duration: 3000,
        })
      );
    this.subscriptions.add(quitSub);
  }
}
