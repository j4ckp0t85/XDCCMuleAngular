import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  EMPTY,
  catchError,
  interval,
  of,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../_shared/config';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';

@Component({
  selector: 'app-active-instances',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    BackButtonComponent
  ],
  templateUrl: './active-instances.component.html',
  styleUrl: './active-instances.component.scss',

})
export class ActiveInstancesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly httpClient = inject(HttpClient);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isFetching = signal(true);
  readonly activeNetworks = signal<{ network: string }[]>([]);
  readonly displayedColumns = ['network', 'action'];

  ngOnInit(): void {
    this.fetchDatas();
  }

  private fetchDatas() {
    this.isFetching.set(true);
    interval(1000)
      .pipe(
        switchMap(() => {
          return this.httpClient
            .get<string[]>(`${API_BASE_URL}/activeinstances`)
            .pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((list) => {
        this.isFetching.set(false);
        if (!list) {
          return;
        }
        if (list.length === 0) {
          this.activeNetworks.set([]);
          return;
        }
        this.activeNetworks.set(list.map((x) => {
          return { network: x };
        }));
      });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  quitInstance(network: string) {
    this.httpClient
      .post(`${API_BASE_URL}/quitinstance`, { network })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => EMPTY)
      )
      .subscribe(() =>
        this.messageService.add({ severity: 'success', summary: `Network ${network} rimosso`, detail: '' })
      );
  }
}
