import { downloadsMap, download } from './download';
import { saveDownloads, extractDatabaseInfo } from './database';
import { DownloadableFile, Server } from '../models';

const CHECK_INTERVAL = 30000;
const DB_URL = 'https://xdccmule.org/GlobalFindEx/DataBase.db';

const recoveryMap = new Map<string, number>();
const processingFiles = new Set<string>();
const pendingTimestamps = new Map<string, number>();

const fetchServers = async (): Promise<Server[]> => {
  try {
    console.log(`Scarico database da: ${DB_URL}`);
    const response = await fetch(DB_URL);
    if (response.ok) {
      const text = await response.text();
      console.log(`Database scaricato, lunghezza: ${text.length} caratteri`);
      const servers = extractDatabaseInfo(text);
      console.log(`\nServer estratti: ${servers.length}`);
      servers.forEach(server => {
        console.log(`  - ${server.name} (${server.address}): ${server.channels.length} canali`);
        server.channels.forEach(ch => {
          console.log(`    * ${ch.channelName}`);
        });
      });
      return servers;
    }
  } catch (e) {
    console.error('Errore nel fetch dei server:', e);
  }
  return [];
};

const searchFileOnServers = async (fileName: string): Promise<DownloadableFile | null> => {
  const servers = await fetchServers();
  console.log(`\nRicerca su ${servers.length} server, ${servers.reduce((acc, s) => acc + s.channels.length, 0)} canali totali`);

  const matches: DownloadableFile[] = [];

  for (const server of servers) {
    for (const channel of server.channels) {
      try {
        const url = `${channel.webUrl}?q=${encodeURIComponent(fileName)}`;
        console.log(`Cerco su: ${channel.channelName}`);
        const response = await fetch(url);

        if (response.ok) {
          const text = await response.text();
          const lines = text.split('\r\n').filter(v => v !== '');

          console.log(`  -> ${lines.length} risultati`);

          for (const line of lines) {
            const entry = line.split(/\s+/);
            if (entry && entry.length >= 4 && entry.length <= 5) {
              matches.push({
                channelName: channel.channelName,
                network: server.address,
                fileNumber: entry[0],
                botName: entry[1],
                fileName: entry.length === 4 ? entry[3] : entry.slice(3).join(' '),
                fileSize: entry[2],
              });
            }
          }
        }
      } catch (e) {
        console.log(`  -> Errore: ${e}`);
        continue;
      }
    }
  }

  if (matches.length > 0) {
    const randomIndex = Math.floor(Math.random() * matches.length);
    console.log(`  -> Trovati ${matches.length} match, seleziono random: #${randomIndex + 1}`);
    return matches[randomIndex];
  }

  return null;
};

export const startErrorMonitoring = () => {
  console.log('Monitor errori avviato');

  setInterval(async () => {
    console.log(`\n[Monitor] Controllo download (totali: ${downloadsMap.size})`);

    const now = Date.now();

    // Gestione download bloccati in pending
    const pendingDownloads = Array.from(downloadsMap.entries()).filter(
      ([_, dl]) => dl.status === 'pending'
    );

    for (const [key, pendingDownload] of pendingDownloads) {
      if (!pendingTimestamps.has(key)) {
        pendingTimestamps.set(key, now);
      } else {
        const elapsed = now - pendingTimestamps.get(key)!;
        if (elapsed > 50000) {
          console.log(`⚠ Download bloccato in pending da ${Math.round(elapsed/1000)}s: ${pendingDownload.fileName}`);
          pendingDownload.status = 'error';
          pendingDownload.errorMessage = 'Timeout: bloccato in pending';
          pendingTimestamps.delete(key);
        }
      }
    }

    // Pulizia timestamp per download non più in pending
    for (const [key] of pendingTimestamps.entries()) {
      const dl = downloadsMap.get(key);
      if (!dl || dl.status !== 'pending') {
        pendingTimestamps.delete(key);
      }
    }

    // Controlla download 'downloaded' ma incompleti
    const downloadedFiles = Array.from(downloadsMap.entries()).filter(
      ([_, dl]) => dl.status === 'downloaded'
    );

    for (const [key, downloadedFile] of downloadedFiles) {
      if (downloadedFile.percentage !== 100 || downloadedFile.errorMessage) {
        console.log(`⚠ File incompleto rilevato: ${downloadedFile.fileName}`);
        downloadedFile.status = 'error';
        if (!downloadedFile.errorMessage) {
          downloadedFile.errorMessage = 'File incompleto';
        }
        recoveryMap.delete(key);
        processingFiles.delete(downloadedFile.fileName);
        pendingTimestamps.delete(key);
        saveDownloads();
      }
    }

    const failedDownloads = Array.from(downloadsMap.entries()).filter(
      ([_, dl]) => dl.errorMessage
    );
    console.log(`[Monitor] Download con errori trovati: ${failedDownloads.length}`);

    for (const [key, failedDownload] of failedDownloads) {
      const attempts = recoveryMap.get(key) || 0;

      if (attempts >= 10) {
        console.log(`⏭ Saltato ${failedDownload.fileName}: raggiunto limite tentativi (10)`);
        continue;
      }

      // Controlla se il file è già in elaborazione
      if (processingFiles.has(failedDownload.fileName)) {
        console.log(`⏳ Saltato ${failedDownload.fileName}: già in elaborazione`);
        continue;
      }

      // Controlla se esiste già un download attivo con lo stesso fileName
      const activeDuplicates = Array.from(downloadsMap.entries()).filter(
        ([k, dl]) => k !== key &&
                     dl.fileName === failedDownload.fileName &&
                     (dl.status === 'downloading' || dl.status === 'pending')
      );

      if (activeDuplicates.length > 0) {
        console.log(`⚠ Download attivo trovato per: ${failedDownload.fileName}, rimuovo quello con errore`);
        downloadsMap.delete(key);
        recoveryMap.delete(key);
        pendingTimestamps.delete(key);
        saveDownloads();
        continue;
      }

      processingFiles.add(failedDownload.fileName);
      recoveryMap.set(key, attempts + 1);
      console.log(`\n=== Tentativo recupero ${attempts + 1}/10: ${failedDownload.fileName} ===`);

      const newFile = await searchFileOnServers(failedDownload.fileName);

      if (newFile) {
        console.log(`✓ File trovato, avvio download`);
        download(newFile);
        downloadsMap.delete(key);
        recoveryMap.delete(key);
        pendingTimestamps.delete(key);
        saveDownloads();
      } else {
        console.log(`✗ File non trovato su nessun canale`);
      }

      processingFiles.delete(failedDownload.fileName);
      console.log(`=== Fine tentativo ===\n`);
    }
  }, CHECK_INTERVAL);
};
