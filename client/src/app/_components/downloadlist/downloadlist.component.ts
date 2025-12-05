import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
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
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DownloadItemComponent } from './_components/download-item/download-item.component';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-downloadlist',
  imports: [
    CommonModule,
    SelectModule,
    PaginatorModule,
    ButtonModule,
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
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private messageService = inject(MessageService);

  private actualSubscription!: Subscription | undefined;

  constructor() { }

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

  private mockDatas() {
    const mock: DownloadingFile[] = [
      {
        network: 'server1',
        channelName: 'channel1',
        fileNumber: 'package1',
        botName: 'bot1',
        fileName: 'File di esempio 1.mp4',
        fileSize: '10MB',
        status: 'downloading',
        percentage: 30,
        rate: '10.0KB/s',
        eta: '10s',
      },
      {
        network: 'server2',
        channelName: 'channel2',
        fileNumber: 'package2',
        botName: 'bot2',
        fileName: 'File di esempio 2 con nome molto lungo per testare il comportamento.mkv',
        fileSize: '100MB',
        status: 'downloaded',
        percentage: 100,
        rate: 'done',
        eta: '2h',
      },
      {
        network: 'server3',
        channelName: 'channel3',
        fileNumber: 'package3',
        botName: 'bot3',
        fileName: 'File di esempio 3.avi',
        fileSize: '50MB',
        status: 'error',
        percentage: 50,
        rate: 'done',
        eta: '30m',
      },
      {
        network: 'server4',
        channelName: 'channel4',
        fileNumber: 'package4',
        botName: 'bot4',
        fileName: 'File di esempio 4.mp4',
        fileSize: '200MB',
        status: 'pending',
        percentage: 0,
        rate: 'waiting',
        eta: 'unknown',
      },
      {
        network: 'server5',
        channelName: 'channel5',
        fileNumber: 'package5',
        botName: 'bot5',
        fileName: 'File di esempio 5.mkv',
        fileSize: '1.2GB',
        status: 'downloading',
        percentage: 75,
        rate: '1.5MB/s',
        eta: '5m',
      },
      {
        network: 'server6',
        channelName: 'channel6',
        fileNumber: 'package6',
        botName: 'bot6',
        fileName: 'File di esempio 6.mp4',
        fileSize: '800MB',
        status: 'cancelled',
        percentage: 25,
        rate: 'cancelled',
        eta: 'cancelled',
      },
      {
        network: 'server7',
        channelName: 'channel7',
        fileNumber: 'package7',
        botName: 'bot7',
        fileName: 'File di esempio 7.mp4',
        fileSize: '350MB',
        status: 'downloading',
        percentage: 45,
        rate: '500KB/s',
        eta: '15m',
      },
      {
        network: 'server8',
        channelName: 'channel8',
        fileNumber: 'package8',
        botName: 'bot8',
        fileName: 'File di esempio 8.mkv',
        fileSize: '2.5GB',
        status: 'pending',
        percentage: 0,
        rate: 'waiting',
        eta: 'unknown',
      },
      {
        network: 'server9',
        channelName: 'channel9',
        fileNumber: 'package9',
        botName: 'bot9',
        fileName: 'File di esempio 9.avi',
        fileSize: '700MB',
        status: 'downloaded',
        percentage: 100,
        rate: 'done',
        eta: 'done',
      },
      {
        network: 'server10',
        channelName: 'channel10',
        fileNumber: 'package10',
        botName: 'bot10',
        fileName: 'File di esempio 10.mp4',
        fileSize: '1.5GB',
        status: 'error',
        percentage: 80,
        rate: 'error',
        eta: 'error',
      }
    ];
    this.downloadList.set(mock);
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
