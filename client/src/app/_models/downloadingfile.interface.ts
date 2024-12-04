export type StatusOption =
  | 'all'
  | 'pending'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'cancelled';

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
