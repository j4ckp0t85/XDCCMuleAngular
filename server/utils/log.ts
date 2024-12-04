import { DownloadableFile, DownloadingFile } from '../models';
import { buildJobKey } from './methods';

export type MessageEvent = {
  nick: string;
  type: string;
  message: string;
};

export const logsMap = new Map<string, MessageEvent[]>();

export const logs = () => new Array(...logsMap.values());

export const saveLog = (
  downloadData: DownloadableFile | DownloadingFile,
  log: MessageEvent
) => {
  const key = buildJobKey(downloadData);
  if (!logsMap.has(key)) {
    logsMap.set(key, [log]);
  } else {
    logsMap.get(key)?.push(log);
  }
};

export const removeLogEntry = (
  downlodData: DownloadableFile | DownloadingFile
) => {
  const key = buildJobKey(downlodData);
  if (logsMap.has(key)) {
    logsMap.delete(key);
  }
};

export const clearLogsMap = () => {
  logsMap.clear();
};

export const getLogs = (file: DownloadableFile | DownloadingFile) => {
  const key = buildJobKey(file);
  if (logsMap.has(key)) {
    return logsMap.get(key);
  }
  return [] as MessageEvent[];
};
