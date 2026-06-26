import { Service, signal } from '@angular/core';
import { Result } from '../../_models/result.interface';
import { Channel } from '../../_models/channel.interface';

@Service()
export class SearchService {
  public readonly searchText = signal<string>('');
  public readonly searchOnAllServers = signal<boolean>(false);
  public readonly searchResults = signal<Result[]>([]);
  public readonly searchingServers = signal<Channel[]>([]);
  public readonly pageSize = signal<number>(50);
  public readonly news = signal<{ id: number; name: string }[]>([]);
}
