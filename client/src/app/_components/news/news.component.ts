import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationExtras } from '@angular/router';
import { API_BASE_URL, NEWS_URL, NEWS_USER_AGENT_GRANT } from '../../_shared/config';
import { catchError } from 'rxjs';
import { SearchService } from '../../_shared/_services/search-inmemory.service';
import { PrimeNgModule } from '../../primeng.module';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
       CommonModule,
       PrimeNgModule,
       BackButtonComponent
    ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})
export class NewsComponent {
  news = signal<{ name: string }[]>([]);
  isLoading = signal(true);
  pageSize = 50;

  // Pagination state
  first = 0;
  currentPage = 0;

  // Displayed data
  displayedData: { name: string }[] = [];

  private searchService!: SearchService;

  constructor(
      private httpClient: HttpClient,
      private router: Router
    ) {
      this.searchService = inject(SearchService) as SearchService;
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
      const start = this.first;
      const end = this.first + this.pageSize;
      this.displayedData = this.news().slice(start, end);
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
        const results : { name: string}[] = [];
        splittedRows.forEach((row) => {
          const split = row.split(' ');
          results.push({ name: split.slice(3, split.length - 1).join(' ')})
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
      this.first = event.first;
      this.currentPage = event.page;
      this.pageSize = event.rows;
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