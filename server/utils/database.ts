import { DownloadingFile, Server } from '../models';
import { DEFAULT_SERVERS, DOWNLOADS_FILE_KEY } from './config';
import { statuses } from './download';
import fs from 'fs';

export const extractDatabaseInfo = (
  databaseContent: string | undefined
): Server[] => {
  if (
    !databaseContent ||
    databaseContent === '' ||
    databaseContent.length < 10
  ) {
    return DEFAULT_SERVERS;
  }
  const extractedChannels: Server[] = [];

  let parsedNetwork = '';
  let currentIndex = 0;
  for (let line of databaseContent.split('\n')) {
    if (line.startsWith('0=')) {
      const name = line.split('*')[0]?.split('=')[1] || parsedNetwork;
      parsedNetwork = line.split('*')[1];
      currentIndex = extractedChannels.length;
      extractedChannels.push({
        id: extractedChannels.length,
        name: name,
        address: parsedNetwork,
        channels: [],
      });
    } else if (line && !line.startsWith('[')) {
      line = line.split('=')[1];
      const [channelName, scriptUrl] = line.split('*');
      extractedChannels[currentIndex].channels.push({
        channelName: channelName,
        webUrl: scriptUrl,
        serverAddress: parsedNetwork,
      });
    }
  }

  return extractedChannels;
};

export const saveDownloads = (clearAll = false) => {
  const downloads = clearAll
    ? statuses().filter(
        (download) =>
          download.status !== 'downloaded' && download.status !== 'cancelled'
      )
    : statuses();
  fs.writeFile(DOWNLOADS_FILE_KEY, JSON.stringify(downloads), () => {});
};

export const getSavedDownloads = () => {
  try {
    const downloads = JSON.parse(
      fs.readFileSync(DOWNLOADS_FILE_KEY, { encoding: 'utf8' })
    );
    return downloads as DownloadingFile[];
  } catch (e) {
    return [] as DownloadingFile[];
  }
};

export const markAllAsError = () => {
  const downloads = getSavedDownloads();
  downloads.forEach((download) => {
    download.status = 'error';
  });
  fs.writeFile(DOWNLOADS_FILE_KEY, JSON.stringify(downloads), () => {});
};