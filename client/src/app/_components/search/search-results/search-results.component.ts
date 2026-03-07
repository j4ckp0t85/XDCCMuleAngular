import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { Result } from '../../../_models/result.interface';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-search-results',
  imports: [TableModule, PaginatorModule, ButtonModule],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsComponent {
  // Inputs
  readonly results = input<Result[]>([]);
  readonly pageSize = input(50);

  // Outputs
  readonly pageSizeChange = output<number>();
  readonly downloadRequest = output<{
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

  // Displayed data as computed signal
  readonly displayedData = computed(() => {
    const start = this.first;
    const end = this.first + this.pageSize();
    return this.results().slice(start, end);
  });

  // Column definitions
  readonly frozenCols = [
    { field: 'server', header: 'Server' },
    { field: 'channel', header: 'Canale' }
  ];

  readonly cols = [
    { field: 'package', header: 'Package' },
    { field: 'bot', header: 'Bot' },
    { field: 'filesize', header: 'Dimensione' },
    { field: 'filename', header: 'Nome file' },
  ];

  onPageEvent(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.currentPage = event.page ?? 0;

    if (event.rows !== this.pageSize()) {
      this.pageSizeChange.emit(event.rows ?? this.pageSize());
    }
  }

  trackByFn(index: number, item: Result): string {
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