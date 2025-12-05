import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';

@Component({
  selector: 'app-active-instances',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    BackButtonComponent
  ],
  templateUrl: './active-instances.component.html',
  styleUrl: './active-instances.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveInstancesComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private httpClient = inject(HttpClient);
  private messageService = inject(MessageService);

  isFetching = signal(true);
  activeNetworks = signal<{ network: string }[]>([]);
  subscriptions = new Subscription();
  displayedColumns = ['network', 'action'];

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
          this.activeNetworks.set([]);
          return;
        }
        this.activeNetworks.set(list.map((x) => {
          return { network: x };
        }));
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
        this.messageService.add({ severity: 'success', summary: `Network ${network} rimosso`, detail: '' })
      );
    this.subscriptions.add(quitSub);
  }
}
