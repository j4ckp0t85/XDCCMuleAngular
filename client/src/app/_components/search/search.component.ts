import { HttpClient } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  Injector,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { forkJoinWithProgress } from '../../_shared/utils';
import {
  ignoreElements,
  merge,
  mergeMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Result } from '../../_models/result.interface';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../_shared/config';
import { Channel } from '../../_models/channel.interface';
import { DBServerService } from '../../_shared/_services/dbserver-inmemory.service';
import { Server } from '../../_models/server.interface';
import { parsePickle } from '../../_shared/pickle-parser';
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
  imports: [
    SearchFormComponent,
    SearchProgressComponent,
    SearchResultsComponent,
    ProgressSpinnerModule,
    ButtonModule,
    BackButtonComponent
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  private readonly searchService = inject(SearchService);
  private readonly dbServiceServer = inject(DBServerService);

  // UI state from service
  readonly searchText = this.searchService.searchText;
  readonly searchOnAllServers = this.searchService.searchOnAllServers;
  readonly pageSize = this.searchService.pageSize;
  readonly results = this.searchService.searchResults;
  readonly searchingServers = this.searchService.searchingServers;

  // Local UI state
  readonly percentageDone = signal(0);
  readonly searchInProgress = signal(false);

  // Server data
  readonly servers = signal<Server[]>([]);

  private flatList: { server: string; channel: string; id: number }[] = [];
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);

  private hasNavigationState = false;

  constructor() {
    this.initializeFromRouterState();

    // React to server list becoming available via rxResource signal
    effect(() => {
      const serverList = this.dbServiceServer.serverList();
      if (serverList && serverList.length > 0) {
        untracked(() => {
          this.servers.set(serverList as Server[]);
          this.createChannelFlatList();

          if (this.hasNavigationState) {
            this.hasNavigationState = false; // Reset
            this.onSelectAllServersChange({ checked: true });
            this.search();
          }
        });
      }
    });
  }

  /**
   * Initialize search text from router state if available
   */
  private initializeFromRouterState(): void {
    // Try to get state from current navigation
    const navigation = this.router.currentNavigation();
    const navigationState = navigation?.extras.state as { searchText: string } | undefined;

    // If not available, try to get it from history state (for page refreshes)
    const historyState = window.history.state as { searchText: string } | undefined;

    // Use navigation state if available, otherwise try history state
    const state = navigationState || historyState;

    if (state?.searchText) {
      this.searchText.set(state.searchText);
      this.hasNavigationState = true;
    }
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
    const trimmed = value.trim();
    const lowerTrimmed = trimmed.toLowerCase();

    // Ignore HTML responses (e.g., error pages, redirect pages, or "PAGINA ERRATA" warning pages)
    if (
      lowerTrimmed.includes('<html') ||
      lowerTrimmed.includes('<!doctype html') ||
      lowerTrimmed.includes('<body') ||
      lowerTrimmed.includes('<head')
    ) {
      return [];
    }

    // Detect Pickle format
    if (trimmed.startsWith('(')) {
      try {
        const parsed = parsePickle(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => {
            const line = Array.isArray(item) ? item.join(' ') : String(item);
            return this.parseLine(line, flatEntry);
          }).filter((item): item is Result => item !== null);
        }
      } catch (e) {
        console.error('Pickle search parse error', e);
      }
    }

    // Fallback to traditional line-based format
    return trimmed
      .split('\n')
      .map(line => this.parseLine(line, flatEntry))
      .filter((item): item is Result => item !== null);
  }

  /**
   * Helper to parse a single line of search result
   */
  private parseLine(line: string, flatEntry: { server: string; channel: string; id: number } | undefined): Result | null {
    const v = line.trim();
    if (!v) return null;

    const entry = v.split(/\s+/);
    if (!entry || entry.length < 4) return null;

    // Validate that the first entry is a valid package number (e.g. #123 or 123)
    const packageId = entry[0];
    if (!/^#?\d+$/.test(packageId)) {
      return null;
    }

    return {
      server: flatEntry?.server ?? '',
      channel: flatEntry?.channel ?? '',
      package: packageId,
      bot: entry[1],
      filesize: entry[2],
      filename: entry.slice(3).join(' ')
    };
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

    forkJoinWithProgress(requests)
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
        ),
        takeUntilDestroyed(this.destroyRef)
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
    downloadFile(
      this.injector,
      data.server,
      data.channel,
      data.bot,
      data.packageId,
      data.fileName,
      data.fileSize
    );
  }
}