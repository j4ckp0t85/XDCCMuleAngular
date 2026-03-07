import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationExtras } from '@angular/router';
import { API_BASE_URL, NEWS_URL, NEWS_USER_AGENT_GRANT } from '../../_shared/config';
import { catchError } from 'rxjs';
import { SearchService } from '../../_shared/_services/search-inmemory.service';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';

@Component({
  selector: 'app-news',
  imports: [
    PaginatorModule,
    ButtonModule,
    TableModule,
    BackButtonComponent
  ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsComponent {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  readonly news = signal<{ name: string }[]>([]);
  readonly isLoading = signal(true);

  // Pagination state
  readonly first = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(50);

  // Displayed data as computed signal (reacts automatically to news/pagination changes)
  readonly displayedData = computed(() => {
    const start = this.first();
    const end = this.first() + this.pageSize();
    return this.news().slice(start, end);
  });

  constructor() {
    if (this.searchService.news?.length > 0) {
      this.news.set(this.searchService.news);
      this.isLoading.set(false);
    } else {
      this.fetchNews();
    }
  }

  fetchNews(): void {
    this.httpClient.post(
      `${API_BASE_URL}/news/`,
      {
        newsurl: NEWS_URL,
        headers: { 'User-Agent': NEWS_USER_AGENT_GRANT },
      },
      {
        responseType: 'text',
      }
    )
      .pipe(catchError(() => {
        this.isLoading.set(false);
        return [];
      }))
      .subscribe((res) => {
        if (res === '') return;
        const splittedRows = res.split('<br>');
        const results: { name: string }[] = [];
        splittedRows.forEach((row) => {
          const split = row.split(' ');
          results.push({ name: split.slice(3, split.length - 1).join(' ') });
        });
        this.news.set(results);
        this.searchService.news = this.news();
        this.isLoading.set(false);
      });
  }

  trackByFn(index: number, item: { name: string }): string {
    return item.name;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  onPageEvent(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.currentPage.set(event.page ?? 0);
    this.pageSize.set(event.rows ?? this.pageSize());
  }

  doSearch(searchText: string): void {
    const navigationExtras: NavigationExtras = {
      state: { searchText }
    };
    this.router.navigate(['/search'], navigationExtras);
    this.searchService.searchText = searchText;
  }
}
