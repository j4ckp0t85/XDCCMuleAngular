import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  signal,
} from '@angular/core';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import {
  DownloadingFile,
  StatusOption,
} from '../../_models/downloadingfile.interface';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../../_shared/config';
import { DownladItemComponent } from './_components/downlad-item/downlad-item.component';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';

@Component({
    selector: 'app-downloadlist',
    imports: [
        MaterialModule,
        CommonModule,
        DownladItemComponent,
    ],
    templateUrl: './downloadlist.component.html',
    styleUrl: './downloadlist.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadlistComponent implements OnInit, OnDestroy {
  downloadList = signal<DownloadingFile[]>([]);
  statusFilter: StatusOption = 'all';
  downloadStatusOptions: StatusOption[] = [
    'all',
    'pending',
    'downloading',
    'downloaded',
    'error',
    'cancelled',
  ];
  totalFiles = computed(() => this.downloadList()?.length);
  private subscriptions = new Subscription();
  private actualSubscription!: Subscription | undefined;
  constructor(private httpClient: HttpClient, private router: Router) {}

  fetchList() {
    if (this.actualSubscription) {
      this.subscriptions.remove(this.actualSubscription);
      this.actualSubscription = undefined;
    }

    this.actualSubscription = interval(1000)
      .pipe(
        startWith([]),
        switchMap(() => {
          return this.httpClient.get<DownloadingFile[]>(
            `${API_BASE_URL}/downloadlist?status=${this.statusFilter}`
          );
        })
      )
      .subscribe((result: DownloadingFile[]) => {
        this.downloadList.set(result);
      });
    this.subscriptions.add(this.actualSubscription);
  }

  ngOnInit(): void {
    this.fetchList();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
