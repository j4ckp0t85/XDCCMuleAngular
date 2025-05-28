import { HttpClient } from '@angular/common/http';
import {
  Component,
  Injector,
  OnDestroy,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { forkJoinWithProgress } from '../../_shared/utils';
import {
  Subscription,
  filter,
  ignoreElements,
  merge,
  mergeMap,
  tap,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { Result } from '../../_models/result.interface';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../_shared/config';
import { Channel } from '../../_models/channel.interface';
import { DBServerService } from '../../_shared/_services/dbserver-inmemory.service';
import { Server } from '../../_models/server.interface';
import { SearchService } from '../../_shared/_services/search-inmemory.service';
import { downloadFile } from '../../_shared/_methods/methods';
import { SearchFormComponent } from './search-form/search-form.component';
import { SearchProgressComponent } from './search-progress/search-progress.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { BackButtonComponent } from '../../_shared/_components/back-button/back-button.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    SearchFormComponent,
    SearchProgressComponent,
    SearchResultsComponent,
    ProgressSpinnerModule,
    ButtonModule,
    BackButtonComponent
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit, OnDestroy {
  // UI state
  percentageDone = signal(0);
  searchInProgress = signal(false);
  searchText = signal('');
  searchOnAllServers = signal(false);
  pageSize = signal(50);

  // Results data
  results = signal<Result[]>([]);

  // Server data
  servers = signal<Server[]>([]);
  searchingServers = signal<Channel[]>([]);

  private flatList: { server: string; channel: string; id: number }[] = [];
  private subscriptions = new Subscription();
  private dbServiceServer = inject(DBServerService);

  constructor(
    private injector: Injector,
    private httpClient: HttpClient,
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.initializeFromRouterState();
    this.subscribeToServerList();
  }

  ngOnDestroy(): void {
    this.saveSearchValuesInMemory();
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize search text from router state if available
   */
  private initializeFromRouterState(): void {
    // Try to get state from current navigation
    const navigation = this.router.getCurrentNavigation();
    const navigationState = navigation?.extras.state as { searchText: string } | undefined;

    // If not available, try to get it from history state (for page refreshes)
    const historyState = window.history.state as { searchText: string } | undefined;

    // Use navigation state if available, otherwise try history state
    const state = navigationState || historyState;

    if (state?.searchText) {
      this.searchText.set(state.searchText);
    }
  }

  /**
   * Subscribe to server list and initialize data when available
   */
  private subscribeToServerList(): void {
    const dbServerSub = this.dbServiceServer.serverList$
      .pipe(
        filter((servers) => servers.length > 0),
        tap((servers) => {
          this.servers.set(servers);
          this.createChannelFlatList();

          if (this.searchText() !== '') {
            this.onSelectAllServersChange({ checked: true });
            this.search();
          } else {
            this.restoreSearchValuesInMemory();
          }
        })
      )
      .subscribe();

    this.subscriptions.add(dbServerSub);
  }

  /**
   * Creates a flat list of all channels across all servers
   */
  private createChannelFlatList(): void {
    let counter = 0;
    this.flatList = [];

    this.servers().forEach((server) => {
      server.channels.forEach((channel) => {
        this.flatList.push({
          server: server.address,
          channel: channel.channelName,
          id: counter++,
        });
      });
    });
  }

  /**
   * Reset search results and progress
   */
  private reset(): void {
    this.percentageDone.set(0);
    this.results.set([]);
  }

  /**
   * Process search results from the API
   */
  private onFetchedResults(results: string[]): void {
    const res: Result[] = results
      .flatMap((value, index) => {
        if (!value) return [];

        const channel = this.searchingServers()[index];
        const flatEntry = this.flatList.find(
          (fe) => fe.channel === channel.channelName &&
                  fe.server === channel.serverAddress
        );

        return this.parseSearchResults(value, flatEntry);
      });

    this.results.set(res);
  }

  /**
   * Parse raw search results into Result objects
   */
  private parseSearchResults(value: string, flatEntry: { server: string; channel: string; id: number } | undefined): Result[] {
    return value
      .split('\r\n')
      .filter(v => v !== '')
      .map(v => {
        const entry = v.split(/\s+/);
        if (!entry || entry.length > 5) return null;

        return {
          server: flatEntry?.server ?? '',
          channel: flatEntry?.channel ?? '',
          package: entry[0],
          bot: entry[1],
          filesize: entry[2],
          filename: entry.length === 4
            ? entry[3]
            : entry.slice(3).join(' ')
        };
      })
      .filter((item): item is Result => item !== null);
  }

  /**
   * Restore search values from memory service
   */
  private restoreSearchValuesInMemory(): void {
    if (this.searchService.pageSize) {
      this.pageSize.set(this.searchService.pageSize);
    }
    if (this.searchService.searchOnAllServers !== undefined) {
      this.searchOnAllServers.set(this.searchService.searchOnAllServers);
    }
    if (this.searchService.searchText) {
      this.searchText.set(this.searchService.searchText);
    }
    if (this.searchService.searchingServers) {
      this.searchingServers.set(this.searchService.searchingServers);
    }
    if (this.searchService.searchResults) {
      this.results.set(this.searchService.searchResults);
    }
  }

  /**
   * Save current search values to memory service
   */
  private saveSearchValuesInMemory(): void {
    this.searchService.pageSize = this.pageSize();
    this.searchService.searchOnAllServers = this.searchOnAllServers();
    this.searchService.searchText = this.searchText();
    this.searchService.searchingServers = this.searchingServers();
    this.searchService.searchResults = this.results();
  }

  /**
   * Update search text
   */
  onSearchTextChange(text: string): void {
    this.searchText.set(text);
  }

  /**
   * Update searching servers
   */
  onSearchingServersChange(servers: Channel[]): void {
    this.searchingServers.set(servers);
  }

  /**
   * Update search on all servers flag
   */
  onSearchOnAllServersChange(value: boolean): void {
    this.searchOnAllServers.set(value);
  }

  /**
   * Handle "select all servers" checkbox change
   */
  onSelectAllServersChange(event: any): void {
    this.searchOnAllServers.set(event.checked);
    this.searchingServers.set(event.checked
      ? this.servers().flatMap((server) => server.channels)
      : []);
  }

  /**
   * Toggle selection of all channels in a server group
   */
  onServerGroupClicked(server: Server): void {
    // Questa funzione non viene più utilizzata perché abbiamo rimosso il click handler dal div
    // La selezione dei canali avviene ora solo tramite le checkbox del p-tree
  }

  /**
   * Update the "all servers" checkbox state based on selected channels
   */
  private updateAllServersCheckboxState(): void {
    const totalChannels = this.servers().flatMap(server => server.channels).length;
    this.searchOnAllServers.set(this.searchingServers().length === totalChannels);
  }

  /**
   * Handle paginator page size change
   */
  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
  }

  /**
   * Execute search against selected servers
   */
  search(): void {
    if (this.searchText() === '' || this.searchingServers().length === 0) {
      return;
    }

    this.searchInProgress.set(true);
    this.reset();

    const requests = this.searchingServers().map((channel) => {
      return this.httpClient.post(
        `${API_BASE_URL}/search/`,
        {
          webUrl: channel.webUrl,
          searchText: this.searchText(),
        },
        {
          responseType: 'text',
        }
      );
    });

    const searchSub = forkJoinWithProgress(requests)
      .pipe(
        mergeMap(([finalResult, progress]) =>
          merge(
            progress.pipe(
              tap((value: number) => {
                this.percentageDone.set(Math.round(value));
              }),
              ignoreElements()
            ),
            finalResult
          )
        )
      )
      .subscribe({
        next: (values) => {
          this.searchInProgress.set(false);
          this.onFetchedResults(values as string[]);
        },
        error: (error) => {
          this.searchInProgress.set(false);
          console.error('Search error:', error);
          // Could add error handling UI here
        }
      });

    this.subscriptions.add(searchSub);
  }

  /**
   * Navigate back to home page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }


  /**
   * Initiate file download
   */
  onDownloadRequest(data: {
    server: string;
    channel: string;
    bot: string;
    packageId: string;
    fileName: string;
    fileSize: string;
  }): void {
    this.subscriptions.add(
      downloadFile(
        this.injector,
        data.server,
        data.channel,
        data.bot,
        data.packageId,
        data.fileName,
        data.fileSize
      )
    );
  }
}