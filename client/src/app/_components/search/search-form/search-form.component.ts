import { Component, ChangeDetectionStrategy, effect, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Server } from '../../../_models/server.interface';
import { Channel } from '../../../_models/channel.interface';

// PrimeNG imports
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { Select, SelectModule } from 'primeng/select';
import { CheckboxChangeEvent, CheckboxModule } from 'primeng/checkbox';
import { TreeModule } from 'primeng/tree';

@Component({
  selector: 'app-search-form',
  imports: [
    FormsModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    CheckboxModule,
    TreeModule,
  ],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFormComponent {
  // Inputs
  readonly servers = input<Server[]>([]);
  readonly searchText = input('');
  readonly searchingServers = input<Channel[]>([]);
  readonly searchOnAllServers = input(false);
  readonly searchInProgress = input(false);

  // Outputs
  readonly searchTextChange = output<string>();
  readonly searchingServersChange = output<Channel[]>();
  readonly searchOnAllServersChange = output<boolean>();
  readonly search = output<void>();
  readonly serverGroupClick = output<Server>();

  // Local var for p-checkbox two-way binding (synced via in-class effect)
  searchAllServers = false;
  readonly channelsDropdown = viewChild<Select>('channelsDropdown');

  // Sync local var when signal changes (Angular 21 in-class effect)
  private readonly _syncAllServers = effect(() => {
    this.searchAllServers = this.searchOnAllServers();
  });

  /**
   * Update search text and emit change
   */
  onSearchTextChange(value: string): void {
    this.searchTextChange.emit(value);
  }

  /**
   * Handle direct change to searching servers
   */
  onSearchingServersChange(servers: Channel[]): void {
    if (!this.servers() || this.servers().length === 0) return;

    this.searchingServersChange.emit(servers);

    // Check if all servers are selected
    const allChannelsCount = this.servers().flatMap(
      (server) => server.channels || []
    ).length;
    const isAllSelected = servers.length === allChannelsCount;

    if (this.searchOnAllServers() !== isAllSelected) {
      this.searchOnAllServersChange.emit(isAllSelected);
    }
  }

  /**
   * Handle "select all servers" checkbox change
   */
  onSelectAllServersChange(event: CheckboxChangeEvent): void {
    if (!event) return;

    this.searchOnAllServersChange.emit(!!event.checked);

    const allChannels =
      event.checked && this.servers()
        ? this.servers().flatMap((server) => server.channels || [])
        : [];

    this.searchingServersChange.emit(allChannels);
  }

  /**
   * Emit search event
   */
  onSearch(): void {
    this.search.emit();
  }

  /**
   * Emit server group click event
   */
  onServerGroupClick(server: Server): void {
    this.serverGroupClick.emit(server);
  }

  /**
   * Check if a channel is selected
   */
  isChannelSelected(channel: Channel): boolean {
    if (!channel || !this.searchingServers()) return false;

    return this.searchingServers().some(
      (c) =>
        c.channelName === channel.channelName &&
        c.serverAddress === channel.serverAddress
    );
  }

  /**
   * Handle channel checkbox change
   */
  onChannelCheckboxChange(isCheckedPrevValue: boolean, channel: Channel): void {
    if (!channel) return;
    const isChecked = !isCheckedPrevValue;
    const currentSelection = this.searchingServers();
    if (isChecked) {
      this.searchingServersChange.emit([...currentSelection, channel]);
    } else {
      const updatedSelection = currentSelection.filter(
        (c) =>
          !(
            c.channelName === channel.channelName &&
            c.serverAddress === channel.serverAddress
          )
      );
      this.searchingServersChange.emit(updatedSelection);
    }
    setTimeout(() => {
      this.channelsDropdown()?.show();
    }, 300);
  }
}
