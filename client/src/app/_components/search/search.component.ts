import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  Injector,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { forkJoinWithProgress } from '../../_shared/utils';
import {
  EMPTY,
  Subscription,
  catchError,
  filter,
  ignoreElements,
  merge,
  mergeMap,
  tap,
} from 'rxjs';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Result } from '../../_models/result.interface';
import { Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { API_BASE_URL } from '../../_shared/config';
import { Channel } from '../../_models/channel.interface';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DBServerService } from '../../_shared/_services/dbserver-inmemory.service';
import { Server } from '../../_models/server.interface';
import { MatTableResponsiveDirective } from '../../_shared/_directive/material-table-responsive.directive';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SearchService } from '../../_shared/_services/search-inmemory.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSelectChange } from '@angular/material/select';
import { downloadFile } from '../../_shared/_methods/methods';

@Component({
    selector: 'app-search',
    imports: [
        MaterialModule,
        CommonModule,
        FormsModule,
        MatTableResponsiveDirective,
    ],
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss'
})
export class SearchComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  percentageDone = 0;
  data = signal<Result[]>([]);
  dataSource = new MatTableDataSource<Result>([]);
  searchText = '';
  displayedColumns: string[] = [
    'server',
    'channel',
    'package',
    'bot',
    'filesize',
    'filename',
    'action',
  ];
  searchInProgress = false;
  searchingServers: Channel[] = [];
  servers!: Server[];
  searchOnAllServers = false;
  pageSize = 50;
  private flatList: { server: string; channel: string; id: number }[] = [];
  private searchService!: SearchService;
  private subscriptions = new Subscription();

  constructor(
    private injector: Injector,
    private httpClient: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.searchService = inject(SearchService) as SearchService;
    const dbServiceServer = inject(DBServerService);
    const dbServerSub = dbServiceServer.serverList$
      .pipe(
        filter((servers) => servers.length > 0),
        tap((servers) => {
          this.servers = servers;
          this.createChannelFlatList();
        })
      )
      .subscribe();
    this.subscriptions.add(dbServerSub);
    effect(() => {
      this.dataSource.data = this.data();
    });
    this.restoreSearchValuesInMemory();
  }

  private createChannelFlatList() {
    let counter = 0;
    this.servers.forEach((server) => {
      server.channels.forEach((channel) => {
        this.flatList.push({
          server: server.address,
          channel: channel.channelName,
          id: counter++,
        });
      });
    });
  }

  private reset() {
    this.percentageDone = 0;
    this.data.set([]);
  }

  private onFethchedResults(results: string[]) {
    const res: Result[] = [];
    results.forEach((value, index) => {
      if (value !== '') {
        value
          .split('\r\n')
          .filter((v: string) => v !== '')
          .forEach((v) => {
            const entry = v.split(/\s+/);
            if (!entry || entry?.length > 5 ) {
              return;
            }
            if (entry.length > 0) {
              const channel = this.searchingServers[index];
              const flatEntry = this.flatList.find(
                (fe) =>
                  fe.channel === channel.channelName &&
                  fe.server === channel.serverAddress
              );
              res.push({
                server: flatEntry?.server ?? '',
                channel: flatEntry?.channel ?? '',
                package: entry[0],
                bot: entry[1],
                filesize: entry[2],
                filename:
                  entry.length === 4
                    ? entry[3]
                    : entry.slice(3, entry.length - 1).join(' '),
              });
            }
          });
      }
    });
    this.data.set(res);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.saveSearchValuesInMemory();
    this.subscriptions.unsubscribe();
  }

  private restoreSearchValuesInMemory() {
    if (this.searchService.pageSize) {
      this.pageSize = this.searchService.pageSize;
    }
    if (this.searchService.searchOnAllServers) {
      this.searchOnAllServers = this.searchService.searchOnAllServers;
    }
    if (this.searchService.searchText) {
      this.searchText = this.searchService.searchText;
    }
    if (this.searchService.searchingServers) {
      this.searchingServers = this.searchService.searchingServers;
    }
    if (this.searchService.searchResults) {
      this.data.set(this.searchService.searchResults);
    }
  }

  private saveSearchValuesInMemory() {
    this.searchService.pageSize = this.pageSize;
    this.searchService.searchOnAllServers = this.searchOnAllServers;
    this.searchService.searchText = this.searchText;
    this.searchService.searchingServers = this.searchingServers;
    this.searchService.searchResults = this.data();
  }

  onSelectServersManualChange(event: MatSelectChange) {
    this.searchOnAllServers =
      this.searchingServers.length ===
      this.servers.flatMap((server) => server.channels).length;
  }

  onSelectAllServersChange(event: MatCheckboxChange) {
    this.searchOnAllServers = event.checked;
    if (event.checked) {
      this.searchingServers = this.servers.flatMap((server) => server.channels);
    } else {
      this.searchingServers = [];
    }
  }

  onServerGroupClicked(server: Server) {
    const channels = server.channels;
    const addingChannels: Channel[] = [];
    const removingChannels: Channel[] = [];
    channels.forEach((channel) => {
      if (!this.searchingServers.includes(channel)) {
        addingChannels.push(channel);
      } else {
        removingChannels.push(channel);
      }
    });
    if (removingChannels.length > 0) {
      this.searchingServers = this.searchingServers.filter(
        (channel) => !removingChannels.includes(channel)
      );
    } else {
      this.searchingServers = [...this.searchingServers, ...addingChannels];
    }
  }

  onPageEvent(event: PageEvent) {
    this.pageSize = event.pageSize;
  }

  search() {
    if (this.searchText === '' || this.searchingServers.length === 0) {
      return;
    }
    this.searchInProgress = true;
    this.reset();

    const requests = this.searchingServers.map((channel) => {
      return this.httpClient.post(
        `${API_BASE_URL}/search/`,
        {
          webUrl: channel.webUrl,
          searchText: this.searchText,
        },
        {
          responseType: 'text',
        }
      );
    });
    const searchsSub = forkJoinWithProgress(requests)
      .pipe(
        mergeMap(([finalResult, progress]) =>
          merge(
            progress.pipe(
              tap((value: number) => {
                this.percentageDone = value;
              }),
              ignoreElements()
            ),
            finalResult
          )
        )
      )
      .subscribe((values) => {
        this.searchInProgress = false;
        this.onFethchedResults(values as string[]);
      });
    this.subscriptions.add(searchsSub);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  onTableSort(sortState: Sort) {
    this.data.update((value: Result[]) => {
      return ([] as Result[]).concat(
        value.sort((a: any, b: any) => {
          if (sortState.direction === 'asc') {
            return a[sortState.active] < b[sortState.active] ? -1 : 1;
          } else if (sortState.direction === 'desc') {
            return a[sortState.active] < b[sortState.active] ? 1 : -1;
          } else {
            return 0;
          }
        })
      );
    });
  }

  downloadFile(
    server: string,
    channel: string,
    bot: string,
    packageId: string,
    fileName: string,
    fileSize: string
  ) {
    this.subscriptions.add(downloadFile(this.injector, server, channel, bot, packageId, fileName, fileSize));
  }
}
