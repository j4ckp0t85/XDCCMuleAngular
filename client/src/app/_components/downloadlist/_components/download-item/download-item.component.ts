import { Component, OnDestroy, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { Subscription } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LogsDialogComponent } from '../logs-dialog/logs-dialog.component';

@Component({
  selector: 'app-download-item',
  imports: [
    CommonModule,
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadItemComponent implements OnDestroy {
  item = input.required<DownloadingFile>();
  layout = input.required<'grid' | 'list'>();

  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private dialogService = inject(DialogService);

  private subscriptions = new Subscription();
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
    const retrySub = this.httpClient
      .post(`${API_BASE_URL}/download`, payload)
      .subscribe(() => {
        item.status = 'pending';
      });
    this.subscriptions.add(retrySub);
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

    this.dialogRef?.onClose.subscribe(() => {
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
    const cancelSub = this.httpClient
      .post(`${API_BASE_URL}/cancel`, payload)
      .subscribe(() => {
        item.status = 'cancelled';
      });
    this.subscriptions.add(cancelSub);
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
    const clearSub = this.httpClient
      .post(`${API_BASE_URL}/clearcompleted`, payload)
      .subscribe();
    this.subscriptions.add(clearSub);
  }

  ngOnDestroy(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.subscriptions.unsubscribe();
  }
}