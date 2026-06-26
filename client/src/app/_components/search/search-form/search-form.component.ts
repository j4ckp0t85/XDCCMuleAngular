import { Component, input, model, output, viewChild } from '@angular/core';
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
})
export class SearchFormComponent {
  readonly servers = input<Server[]>([]);
  readonly searchInProgress = input(false);
  readonly searchText = model('');
  readonly searchingServers = model<Channel[]>([]);
  readonly searchOnAllServers = model(false);
  readonly search = output<void>();
  readonly serverGroupClick = output<Server>();

  readonly channelsDropdown = viewChild<Select>('channelsDropdown');

  /**
   * Handle "select all servers" checkbox change
   */
  onSelectAllServersChange(event: CheckboxChangeEvent): void {
    if (!event) return;

    const checked = !!event.checked;
    this.searchOnAllServers.set(checked);

    const allChannels =
      checked && this.servers()
        ? this.servers().flatMap((server) => server.channels || [])
        : [];

    this.searchingServers.set(allChannels);
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
    let updatedSelection: Channel[];
    if (isChecked) {
      updatedSelection = [...currentSelection, channel];
    } else {
      updatedSelection = currentSelection.filter(
        (c) =>
          !(
            c.channelName === channel.channelName &&
            c.serverAddress === channel.serverAddress
          )
      );
    }

    this.searchingServers.set(updatedSelection);

    // Check if all channels are selected
    const allChannelsCount = this.servers().flatMap(
      (server) => server.channels || []
    ).length;
    const isAllSelected = updatedSelection.length === allChannelsCount;

    if (this.searchOnAllServers() !== isAllSelected) {
      this.searchOnAllServers.set(isAllSelected);
    }

    setTimeout(() => {
      this.channelsDropdown()?.show();
    }, 300);
  }
}
