import { Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Result } from '../../../_models/result.interface';
import { PrimeNgModule } from '../../../primeng.module';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent {
  // Inputs
  results = input<Result[]>([]);
  pageSize = input(50);

  // Outputs
  pageSizeChange = output<number>();
  downloadRequest = output<{
    server: string;
    channel: string;
    bot: string;
    packageId: string;
    fileName: string;
    fileSize: string;
  }>();

  // Pagination state
  first = 0;
  currentPage = 0;

  // Displayed data
  displayedData: Result[] = [];

  // Definizione delle colonne
  frozenCols = [
    { field: 'server', header: 'Server' },
    { field: 'channel', header: 'Canale' }
  ];

  cols = [
    { field: 'package', header: 'Package' },
    { field: 'bot', header: 'Bot' },
    { field: 'filesize', header: 'Dimensione' },
    { field: 'filename', header: 'Nome file' },
  ];

  constructor() {
    effect(() => {
      // Update displayed data whenever results or pagination changes
      this.updateDisplayedData();
    });
  }

  updateDisplayedData(): void {
    const start = this.first;
    const end = this.first + this.pageSize();
    this.displayedData = this.results().slice(start, end);
  }

  onPageEvent(event: any): void {
    this.first = event.first;
    this.currentPage = event.page;

    if (event.rows !== this.pageSize()) {
      this.pageSizeChange.emit(event.rows);
    }

    this.updateDisplayedData();
  }

  trackByFn(index: number, item: Result): string {
    // Creiamo una chiave unica combinando i campi che identificano univocamente un risultato
    return `${item.server}-${item.channel}-${item.bot}-${item.package}`;
  }

  onDownload(
    server: string,
    channel: string,
    bot: string,
    packageId: string,
    fileName: string,
    fileSize: string
  ): void {
    this.downloadRequest.emit({
      server,
      channel,
      bot,
      packageId,
      fileName,
      fileSize
    });
  }
}