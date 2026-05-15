import { DownloadingFile, Server } from '../models';
import { DEFAULT_SERVERS, DOWNLOADS_FILE_KEY } from './config';
import { statuses } from './download';
import fs from 'fs';
import { parsePickle } from './pickle-parser';

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

  // Handle Pickle format if detected
  if (databaseContent.startsWith('(')) {
    try {
      const parsed = parsePickle(databaseContent);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const extractedChannels: Server[] = [];
        Object.keys(parsed).forEach((serverName, idx) => {
          const channelList = parsed[serverName];
          if (Array.isArray(channelList)) {
            const address = channelList.length > 0 ? channelList[0].server_URI : '';
            extractedChannels.push({
              id: idx,
              name: serverName,
              address: address,
              channels: channelList.map((ch: any) => ({
                channelName: ch.channel,
                webUrl: ch.list,
                serverAddress: ch.server_URI
              }))
            });
          }
        });
        return extractedChannels.length > 0 ? extractedChannels : DEFAULT_SERVERS;
      }
    } catch (e) {
      console.error('[Database] Pickle parse error:', e);
    }
  }

  // Fallback to old line-based format
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
      const parts = line.split('=');
      if (parts.length > 1) {
        const val = parts[1];
        const [channelName, scriptUrl] = val.split('*');
        if (extractedChannels[currentIndex]) {
          extractedChannels[currentIndex].channels.push({
            channelName: channelName,
            webUrl: scriptUrl,
            serverAddress: parsedNetwork,
          });
        }
      }
    }
  }

  return extractedChannels.length > 0 ? extractedChannels : DEFAULT_SERVERS;
};

export const saveDownloads = (clearAll = false) => {
  const downloads = clearAll
    ? statuses().filter(
        (download) =>
          download.status !== 'downloaded' && download.status !== 'cancelled'
      )
    : statuses();
  try {
    fs.writeFileSync(DOWNLOADS_FILE_KEY, JSON.stringify(downloads, null, 2));
  } catch (e) {
    console.error('[Database] Errore salvataggio downloads:', e);
  }
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
  try {
    fs.writeFileSync(DOWNLOADS_FILE_KEY, JSON.stringify(downloads, null, 2));
  } catch (e) {
    console.error('[Database] Errore markAllAsError:', e);
  }
};