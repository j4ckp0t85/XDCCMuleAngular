import { Component, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationExtras } from '@angular/router';
import { API_BASE_URL, NEWS_URL, NEWS_USER_AGENT_GRANT } from '../../_shared/config';
import { catchError } from 'rxjs';
import { SearchService } from '../../_shared/_services/search-inmemory.service';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';

@Component({
  selector: 'app-news',
  imports: [
    CommonModule,
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
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private searchService = inject(SearchService);

  news = signal<{ name: string }[]>([]);
  isLoading = signal(true);

  // Pagination state
  first = signal(0);
  currentPage = signal(0);
  pageSize = signal(50);

  // Displayed data
  displayedData = signal<{ name: string }[]>([]);

  constructor() {
    if (this.searchService.news?.length > 0) {
      this.news.set(this.searchService.news);
      this.isLoading.set(false);
      this.updateDisplayedData();
    } else {
      this.fetchNews();
    }

    effect(() => {
      this.updateDisplayedData();
    });
  }

  updateDisplayedData(): void {
    const start = this.first();
    const end = this.first() + this.pageSize();
    this.displayedData.set(this.news().slice(start, end));
  }

  fetchNews() {
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
          results.push({ name: split.slice(3, split.length - 1).join(' ') })
        });
        this.news.set(results);
        this.searchService.news = this.news();
        this.isLoading.set(false);
        this.updateDisplayedData();
      });
  }

  trackByFn(index: number, item: { name: string }): string {
    // Usiamo il nome come chiave unica poiché è l'unico campo disponibile
    // e dovrebbe essere univoco nel contesto delle news
    return item.name;
  }

  goHome() {
    this.router.navigate(['/']);
  }

  onPageEvent(event: any) {
    this.first.set(event.first);
    this.currentPage.set(event.page);
    this.pageSize.set(event.rows);
    this.updateDisplayedData();
  }

  doSearch(searchText: string) {
    // Create navigation extras with state
    const navigationExtras: NavigationExtras = {
      state: { searchText }
    };

    // Navigate to search page with state
    this.router.navigate(['/search'], navigationExtras);

    // Also update the search service directly to ensure data is available
    // even if the navigation state is lost
    this.searchService.searchText = searchText;
  }
}

