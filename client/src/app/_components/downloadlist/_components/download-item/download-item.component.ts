import { Component, DestroyRef, OnDestroy, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { KnobModule } from 'primeng/knob';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DownloadableFile, DownloadingFile } from '../../../../_models/downloadingfile.interface';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../../../_shared/config';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LogsDialogComponent } from '../logs-dialog/logs-dialog.component';

@Component({
  selector: 'app-download-item',
  imports: [
    ButtonModule,
    ChipModule,
    KnobModule,
    ProgressBarModule,
    TooltipModule,
    FormsModule
  ],
  templateUrl: './download-item.component.html',
  styleUrl: './download-item.component.scss',
  providers: [DialogService],

})
export class DownloadItemComponent implements OnDestroy {
  readonly item = input.required<DownloadingFile>();
  readonly layout = input.required<'grid' | 'list'>();

  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);

  private dialogRef: DynamicDialogRef | null | undefined;

  getProgressColor(item: DownloadingFile): string {
    switch (item.status) {
      case 'downloaded':
        return '#22C55E'; // Verde
      case 'error':
        return '#EF4444'; // Rosso
      case 'cancelled':
        return '#64748B'; // Grigio
      case 'pending':
        return '#F59E0B'; // Arancione
      default:
        return '#3B82F6'; // Blu primario
    }
  }

  redoSearch(fileName: string) {
    this.router.navigate(['/search'], { state: { searchText: fileName } });
  }

  retryDL() {
    const item = this.item();
    const payload: DownloadableFile = {
      network: item.network,
      channelName: item.channelName,
      botName: item.botName,
      fileNumber: item.fileNumber,
      fileName: item.fileName,
      fileSize: item.fileSize
    }
    this.httpClient
      .post(`${API_BASE_URL}/download`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        item.status = 'pending';
      });
  }

  showLogs() {
    // Implementazione con PrimeNG Dialog
    this.dialogRef = this.dialogService.open(LogsDialogComponent, {
      header: 'Logs per ' + this.item().fileName,
      width: '70%',
      contentStyle: { "max-height": "500px", "overflow": "auto" },
      baseZIndex: 10000,
      data: {
        item: this.item()
      }
    });

    this.dialogRef?.onClose
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.dialogRef = undefined;
      });
  }

  cancelDL() {
    const item = this.item();
    const payload: DownloadableFile = {
      network: item.network,
      channelName: item.channelName,
      botName: item.botName,
      fileNumber: item.fileNumber,
      fileName: item.fileName,
      fileSize: item.fileSize
    }
    this.httpClient
      .post(`${API_BASE_URL}/cancel`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        item.status = 'cancelled';
      });
  }

  clearCompletedDL() {
    const item = this.item();
    const payload: DownloadableFile = {
      network: item.network,
      channelName: item.channelName,
      botName: item.botName,
      fileNumber: item.fileNumber,
      fileName: item.fileName,
      fileSize: item.fileSize
    }
    this.httpClient
      .post(`${API_BASE_URL}/clearcompleted`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}