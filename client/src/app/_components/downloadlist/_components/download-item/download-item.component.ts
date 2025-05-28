import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../../../primeng.module';
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
  standalone: true,
  imports: [
    CommonModule,
    PrimeNgModule,
    FormsModule
  ],
  templateUrl: './download-item.component.html',
  styleUrl: './download-item.component.scss',
  providers: [DialogService]
})
export class DownloadItemComponent implements OnDestroy {
  @Input({ required: true }) item!: DownloadingFile;
  @Input({ required: true }) layout: 'grid' | 'list' = 'grid';

  private subscriptions = new Subscription();
  private dialogRef: DynamicDialogRef | undefined;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private dialogService: DialogService
  ) {}

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
    const payload: DownloadableFile = {
      network: this.item.network,
      channelName: this.item.channelName,
      botName: this.item.botName,
      fileNumber: this.item.fileNumber,
      fileName: this.item.fileName,
      fileSize: this.item.fileSize
    }
    const retrySub = this.httpClient
      .post(`${API_BASE_URL}/download`, payload)
      .subscribe(() => {
        this.item.status = 'pending';
      });
    this.subscriptions.add(retrySub);
  }

  showLogs() {
    // Implementazione con PrimeNG Dialog
    this.dialogRef = this.dialogService.open(LogsDialogComponent, {
      header: 'Logs per ' + this.item.fileName,
      width: '70%',
      contentStyle: { "max-height": "500px", "overflow": "auto" },
      baseZIndex: 10000,
      data: {
        item: this.item
      }
    });

    this.dialogRef.onClose.subscribe(() => {
      this.dialogRef = undefined;
    });
  }

  cancelDL() {
    const payload: DownloadableFile = {
      network: this.item.network,
      channelName: this.item.channelName,
      botName: this.item.botName,
      fileNumber: this.item.fileNumber,
      fileName: this.item.fileName,
      fileSize: this.item.fileSize
    }
    const cancelSub = this.httpClient
      .post(`${API_BASE_URL}/cancel`, payload)
      .subscribe(() => {
        this.item.status = 'cancelled';
      });
    this.subscriptions.add(cancelSub);
  }

  clearCompletedDL() {
    const payload: DownloadableFile = {
      network: this.item.network,
      channelName: this.item.channelName,
      botName: this.item.botName,
      fileNumber: this.item.fileNumber,
      fileName: this.item.fileName,
      fileSize: this.item.fileSize
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