import { Injectable } from '@angular/core';
import { Result } from '../../_models/result.interface';
import { Server } from '../../_models/server.interface';
import { Channel } from '../../_models/channel.interface';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private _searchText!: string;
  private _searchOnAllServers!: boolean;
  private _searchResults!: Result[];
  private _searchingServers!: Channel[];
  private _pageSize!: number;

  get pageSize(): number {
    return this._pageSize;
  }

  get searchOnAllServers(): boolean {
    return this._searchOnAllServers;
  }

  get searchText(): string {
    return this._searchText;
  }

  get searchResults(): Result[] {
    return this._searchResults;
  }

  get searchingServers(): Channel[] {
    return this._searchingServers;
  }

  set pageSize(value: number) {
    this._pageSize = value;
  }

  set searchOnAllServers(value: boolean) {
    this._searchOnAllServers = value;
  }

  set searchText(value: string) {
    this._searchText = value;
  }

  set searchResults(value: Result[]) {
    this._searchResults = value;
  }

  set searchingServers(value: Channel[]) {
    this._searchingServers = value;
  }
}
