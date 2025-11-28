import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../../../primeng.module';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HttpClient } from '@angular/common/http';
import { DownloadingFile } from '../../../../_models/downloadingfile.interface';
import { API_BASE_URL } from '../../../../_shared/config';
import { LogMessageEvent } from '../../../../_models/logmessage.interface';
import { catchError, EMPTY, Subscription } from 'rxjs';

@Component({
  selector: 'app-logs-dialog',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './logs-dialog.component.html',
  styleUrl: './logs-dialog.component.scss'
})
export class LogsDialogComponent implements OnDestroy {
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private httpClient = inject(HttpClient);

  logs: LogMessageEvent[] = [];
  private subscriptions = new Subscription();

  constructor() {
    // Recupera i logs dal servizio
    const item = this.config.data?.item as DownloadingFile;
    if (item) {
      this.fetchLogs(item);
    }
  }

  fetchLogs(item: DownloadingFile) {
    const sub = this.httpClient.post<LogMessageEvent[]>(`${API_BASE_URL}/logs`, {
      server: item.network,
      channel: item.channelName,
      bot: item.botName,
      package: item.fileNumber,
      filename: item.fileName,
      filesize: item.fileSize,
    })
    .pipe(catchError(() => EMPTY))
    .subscribe(response => {
      this.logs = response || [];
    });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}