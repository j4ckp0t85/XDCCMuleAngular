import XDCC, { Params } from 'xdccjs';

export type Channel = {
  channelName: string;
  webUrl: string;
  serverAddress: string;
};

export type Server = {
  id: number;
  name: string;
  address: string;
  channels: Channel[];
};

export type StatusOption =
  | 'pending'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'cancelled';

export interface XDCCMapEntry {
  instance: XDCC;
  conf: Params;
  channelsJoined: string[];
}

export interface DownloadableFile {
  channelName: string;
  network: string;
  fileNumber: string;
  fileSize: string;
  botName: string;
  fileName: string;
}

export interface DownloadingFile extends DownloadableFile {
  status: StatusOption;
  percentage: number;
  rate: string;
  eta: string;
  errorMessage?: string;
}

export interface ResetRequest {
  deleteAllJobs: boolean;
  closeAllXdccInstances: boolean;
  cleanDownloads: boolean;
}
