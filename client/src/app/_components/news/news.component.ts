import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationExtras } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { API_BASE_URL, NEWS_URL, NEWS_USER_AGENT_GRANT } from '../../_shared/config';
import { parsePickle } from '../../_shared/pickle-parser';
import { catchError, map, of } from 'rxjs';
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
})
export class NewsComponent {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  // Use rxResource to fetch news - handles loading/error/value natively
  readonly newsResource = rxResource<{ id: number; name: string }[], void>({
    stream: () => {
      // Return cached data if available
      if (this.searchService.news().length > 0) {
        return of(this.searchService.news());
      }

      return this.httpClient.post(
        `${API_BASE_URL}/news/`,
        {
          newsurl: NEWS_URL,
          headers: { 'User-Agent': NEWS_USER_AGENT_GRANT },
        },
        {
          responseType: 'text',
        }
      ).pipe(
        map((res) => {
          if (!res) return [];

          const parsed = parsePickle(res);
          if (!parsed) return [];

          const results: { id: number; name: string }[] = [];
          let idCounter = 0;
          // The parsed object is a dictionary with categories as keys and list of names as values
          Object.values(parsed).forEach((itemList: any) => {
            if (Array.isArray(itemList)) {
              itemList.forEach((value: string) => {
                const words = value.split(' ');
                const cleanedName = words.length > 1 ? words.slice(0, -1).join(' ') : value;
                results.push({ id: idCounter++, name: cleanedName });
              });
            }
          });

          // Cache results in service signal
          this.searchService.news.set(results);
          return results;
        }),
        catchError((error) => {
          console.error('Error parsing news pickle:', error);
          return of([] as { id: number; name: string }[]);
        })
      );
    },
  });

  readonly news = computed(() => this.newsResource.value() ?? []);
  readonly isLoading = this.newsResource.isLoading;

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

  trackByFn(index: number, item: { id: number; name: string }): number {
    return item.id;
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
    this.searchService.searchText.set(searchText);
  }
}
