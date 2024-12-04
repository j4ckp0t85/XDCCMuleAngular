import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  Input,
  OnDestroy,
} from '@angular/core';
import { DownloadingFile } from '../../../../_models/downloadingfile.interface';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { MaterialModule } from '../../../../material.module';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Subscription, catchError } from 'rxjs';
import { API_BASE_URL } from '../../../../_shared/config';
import { MatDialog } from '@angular/material/dialog';
import { LogsComponent } from '../../../../_shared/_components/logs/logs.component';
import { LogMessageEvent } from '../../../../_models/logmessage.interface';
import { downloadFile } from '../../../../_shared/_methods/methods';

@Component({
    selector: 'app-downlad-item',
    imports: [
        CommonModule,
        MaterialModule,
        RoundProgressModule,
        LogsComponent,
    ],
    templateUrl: './downlad-item.component.html',
    styleUrl: './downlad-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownladItemComponent implements OnDestroy {
  @Input({ required: true }) downloadItem!: DownloadingFile;
  private subscriptions = new Subscription();

  constructor(private httpClient: HttpClient, private dialog: MatDialog, private injector: Injector) {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getHeaderBgColor() {
    if (this.downloadItem.percentage === 100) {
      return 'green';
    }
    switch (this.downloadItem.status) {
      case 'downloading':
        return '#3a25c2';
      case 'downloaded':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'black';
    }
  }

  cancelDL() {
    const cancelSub = this.httpClient
      .post(`${API_BASE_URL}/cancel`, this.downloadItem)
      .subscribe();
    this.subscriptions.add(cancelSub);
  }

  clearCompletedDL() {
    const completesub = this.httpClient
      .post(`${API_BASE_URL}/clearcompleted`, this.downloadItem)
      .subscribe();
    this.subscriptions.add(completesub);
  }

  showLogs() {
    const logSub = this.httpClient
      .post<LogMessageEvent[]>(`${API_BASE_URL}/logs`, this.downloadItem)
      .pipe(catchError(() => EMPTY))
      .subscribe((logMessages) =>
        this.dialog.open(LogsComponent, {
          data: { messages: logMessages },
          width: '50vw',
          height: '40vh',
        })
      );
    this.subscriptions.add(logSub);
  }

  retryDL() {
    this.subscriptions.add(downloadFile(this.injector, this.downloadItem.network, this.downloadItem.channelName, this.downloadItem.botName, this.downloadItem.fileNumber, this.downloadItem.fileName, this.downloadItem.fileSize));
  }
}
