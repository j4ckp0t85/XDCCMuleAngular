import { Component, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HttpClient } from '@angular/common/http';
import { DownloadingFile } from '../../../../_models/downloadingfile.interface';
import { API_BASE_URL } from '../../../../_shared/config';
import { LogMessageEvent } from '../../../../_models/logmessage.interface';
import { catchError, EMPTY, Subscription } from 'rxjs';

@Component({
  selector: 'app-logs-dialog',
  imports: [ScrollPanelModule],
  templateUrl: './logs-dialog.component.html',
  styleUrl: './logs-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogsDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  private readonly httpClient = inject(HttpClient);

  logs: LogMessageEvent[] = [];
  private readonly subscriptions = new Subscription();

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