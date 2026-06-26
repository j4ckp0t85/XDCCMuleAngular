import { Component, computed, inject, signal } from '@angular/core';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HttpClient } from '@angular/common/http';
import { DownloadingFile } from '../../../../_models/downloadingfile.interface';
import { API_BASE_URL } from '../../../../_shared/config';
import { LogMessageEvent } from '../../../../_models/logmessage.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, of } from 'rxjs';

@Component({
  selector: 'app-logs-dialog',
  imports: [ScrollPanelModule],
  templateUrl: './logs-dialog.component.html',
  styleUrl: './logs-dialog.component.scss',
})
export class LogsDialogComponent {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  private readonly httpClient = inject(HttpClient);

  private readonly item = signal(this.config.data?.item as DownloadingFile | undefined);

  readonly logsResource = rxResource<LogMessageEvent[], DownloadingFile | undefined>({
    params: () => this.item(),
    stream: ({ params: item }) => {
      if (!item) return of([]);
      return this.httpClient.post<LogMessageEvent[]>(`${API_BASE_URL}/logs`, {
        server: item.network,
        channel: item.channelName,
        bot: item.botName,
        package: item.fileNumber,
        filename: item.fileName,
        filesize: item.fileSize,
      }).pipe(catchError(() => of([] as LogMessageEvent[])));
    },
  });

  readonly logs = computed(() => this.logsResource.value() ?? []);

  close() {
    this.dialogRef.close();
  }
}