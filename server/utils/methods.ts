import { DownloadableFile, DownloadingFile } from '../models';

export const buildJobKey = (file: DownloadableFile | DownloadingFile) =>
  `${file.network}-${file.channelName}-${file.botName}-${file.fileNumber}`;
