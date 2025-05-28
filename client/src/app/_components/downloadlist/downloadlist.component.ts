import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  linkedSignal,
  signal,
} from '@angular/core';
import { Subscription, interval, startWith, switchMap, catchError, EMPTY } from 'rxjs';
import {
  DownloadingFile,
  StatusOption,
} from '../../_models/downloadingfile.interface';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../../_shared/config';
import { Router } from '@angular/router';
import { PrimeNgModule } from '../../primeng.module';
import { FormsModule } from '@angular/forms';
import { DownloadItemComponent } from './_components/download-item/download-item.component';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-downloadlist',
    standalone: true,
    imports: [
        CommonModule,
        PrimeNgModule,
        FormsModule,
        DownloadItemComponent,
        BackButtonComponent
    ],
    templateUrl: './downloadlist.component.html',
    styleUrl: './downloadlist.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadlistComponent implements OnInit, OnDestroy {
  private readonly LAYOUT_STORAGE_KEY = 'downloadlist-layout';

  downloadList = signal<DownloadingFile[]>([]);
  statusFilter: StatusOption = 'all';
  downloadStatusOptions = [
    { label: 'Tutti', value: 'all' },
    { label: 'In attesa', value: 'pending' },
    { label: 'In download', value: 'downloading' },
    { label: 'Scaricati', value: 'downloaded' },
    { label: 'Errore', value: 'error' },
    { label: 'Cancellati', value: 'cancelled' },
  ];
  totalFiles = linkedSignal({
    source: this.downloadList,
    computation: (downloadList: DownloadingFile[]) => downloadList.length,
  });

  // Layout state
  layout: 'grid' | 'list' = this.loadLayoutPreference();

  // Pagination state
  first = 0;
  pageSize = 12;

  // Displayed data based on pagination
  displayedData = computed(() => {
    const start = this.first;
    const end = this.first + this.pageSize;
    return this.downloadList().slice(start, end);
  });

  private subscriptions = new Subscription();
  private actualSubscription!: Subscription | undefined;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private messageService: MessageService
  ) {}

  /**
   * Load layout preference from localStorage
   */
  private loadLayoutPreference(): 'grid' | 'list' {
    const savedLayout = localStorage.getItem(this.LAYOUT_STORAGE_KEY);
    return (savedLayout === 'grid' || savedLayout === 'list') ? savedLayout : 'grid';
  }

  /**
   * Save layout preference to localStorage
   */
  private saveLayoutPreference(layout: 'grid' | 'list'): void {
    localStorage.setItem(this.LAYOUT_STORAGE_KEY, layout);
  }

  /**
   * Update layout and save preference
   */
  setLayout(layout: 'grid' | 'list'): void {
    this.layout = layout;
    this.saveLayoutPreference(layout);
  }

  /**
   * Generate a unique tracking key for each download item
   * This prevents unnecessary DOM re-creation when items are updated
   */
  getItemTrackKey(index: number, item: DownloadingFile): string {
    return `${item.network}-${item.channelName}-${item.botName}-${item.fileNumber}-${item.fileName}`;
  }

  /**
   * Clean downloads by calling the reset API with cleanDownloads: true
   */
  cleanDownloads(): void {
    const resetSub = this.httpClient
      .post(`${API_BASE_URL}/reset`, { cleanDownloads: true })
      .pipe(catchError(() => EMPTY))
      .subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Operazione completata',
          detail: 'I download sono stati puliti con successo'
        });
        this.fetchList(); // Refresh the list after cleaning
      });
    this.subscriptions.add(resetSub);
  }

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
        this.downloadList.set(result.map(res => Object.assign({} as DownloadingFile, res, { percentage: Math.round(res.percentage) })));
      });
    this.subscriptions.add(this.actualSubscription);

    if (this.statusFilter === 'all') {
      // Already set by mockDatas()
    } else {
      const filtered = this.downloadList().filter(item => item.status === this.statusFilter);
      this.downloadList.set(filtered);
    }

    // Reset pagination
    this.first = 0;
  }

  onPageEvent(event: any): void {
    this.first = event.first;
    this.pageSize = event.rows;
  }

  ngOnInit(): void {
    // this.mockDatas();
    this.fetchList();
  }

  goHome() {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
