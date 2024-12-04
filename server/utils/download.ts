import XDCC, { FileInfo, Job } from 'xdccjs';
import { generateNewConf, updateExistingConf } from './config';
import { getSavedDownloads, saveDownloads } from './database';
import { buildJobKey } from './methods';
import { removeLogEntry, saveLog } from './log';
import { xdccJsInstancesMap } from './network';
import {
  DownloadableFile,
  DownloadingFile,
  StatusOption,
  XDCCMapEntry,
} from '../models';
export const jobsMap = new Map<string, Job>();

export const downloadsMap = new Map<string, DownloadingFile>();

getSavedDownloads().forEach((download) =>
  downloadsMap.set(buildJobKey(download), download)
);

const isSameFile = (fileInfo: FileInfo, fileToDownload: DownloadableFile) =>
  fileInfo.file === fileToDownload.fileName;

export const statuses = () => new Array(...downloadsMap.values());

export const startdl = async (
  xdccMapEntry: XDCCMapEntry | undefined,
  fileToDownload: DownloadableFile
) => {
  if (!xdccMapEntry) {
    return;
  }
  const job: Job | undefined = await xdccMapEntry.instance.download(
    fileToDownload.botName,
    fileToDownload.fileNumber
  );
  const jobKey = buildJobKey(fileToDownload);
  if (!job) {
    return;
  }
  jobsMap.set(jobKey, job);

  const downloadData = {
    channelName: fileToDownload.channelName,
    network: fileToDownload.network,
    fileNumber: fileToDownload.fileNumber,
    fileSize: fileToDownload.fileSize,
    botName: fileToDownload.botName,
    fileName: fileToDownload.fileName,
    percentage: 0,
    rate: '',
    eta: '',
    status: 'pending' as StatusOption,
    errorMessage: undefined as string | undefined,
  } as DownloadingFile;
  downloadsMap.set(jobKey, downloadData);
  saveDownloads();

  job.on('downloading', (fileInfo, received, percentage, eta, rate) => {
    if (isSameFile(fileInfo, downloadData)) {
      downloadData.status = 'downloading' as StatusOption;
      downloadData.percentage = percentage;
      downloadData.rate = rate;
      downloadData.eta = eta;
      downloadsMap.set(jobKey, downloadData);
    }
    if (percentage < 1) {
      saveDownloads();
    }
  });

  job.on('message', (messageEvent) => {
    saveLog(downloadData, messageEvent);
  });

  job.on('error', (error, fileInfo) => {
    if (!fileInfo || isSameFile(fileInfo, downloadData)) {
      downloadData.status = 'error';
      downloadData.errorMessage = error;
    }
  });

  job.on('cancel', () => {
    downloadData.status = 'cancelled';
    jobsMap.delete(jobKey);
    saveDownloads();
  });

  job.on('done', (fileInfo) => {
    downloadData.status = 'downloaded';
    saveDownloads();
  });
};

export const download = function (fileToDownload: DownloadableFile) {
  let xdccMapEntry: XDCCMapEntry | undefined = undefined;
  if (!xdccJsInstancesMap.has(fileToDownload.network)) {
    const conf = generateNewConf(
      fileToDownload.network,
      fileToDownload.channelName
    );
    xdccJsInstancesMap.set(fileToDownload.network, {
      instance: new XDCC(conf),
      conf: conf,
      channelsJoined: [fileToDownload.channelName],
    });
    xdccMapEntry = xdccJsInstancesMap.get(fileToDownload.network);
    if (!xdccMapEntry) {
      return;
    }
    xdccMapEntry.instance.on('ready', async () => {
      startdl(xdccMapEntry, fileToDownload);
    });
  } else {
    xdccMapEntry = xdccJsInstancesMap.get(fileToDownload.network);
    if (!xdccMapEntry) {
      return;
    }
    if (!xdccMapEntry.channelsJoined.includes(fileToDownload.channelName)) {
      xdccMapEntry.instance.join(fileToDownload.channelName);
      xdccMapEntry.channelsJoined.push(fileToDownload.channelName);
      xdccMapEntry.conf = updateExistingConf(
        xdccMapEntry.conf,
        fileToDownload.channelName
      );
    }
    startdl(xdccMapEntry, fileToDownload);
  }
};

export const cancel = (fileToCancel: DownloadableFile) => {
  const jobKey = buildJobKey(fileToCancel);
  const downloadEntry = downloadsMap.get(jobKey);
  if (!downloadEntry) {
    return;
  }
  const xdccInstance = xdccJsInstancesMap.get(downloadEntry.network);
  if (!xdccInstance) {
    return;
  }
  let message;
  if (downloadEntry.status === 'downloading') {
    message = 'xdcc cancel';
  } else {
    message = `xdcc remove ${fileToCancel.fileNumber}`;
  }
  (xdccInstance.instance as XDCC).say(fileToCancel.botName, message);
  downloadEntry.status = 'cancelled';
  const job = jobsMap.get(jobKey);
  if (!job) {
    return;
  }
  if (!job?.queue || job?.queue?.length <= 1) {
    jobsMap.delete(jobKey);
  } else {
    job.queue = job.queue.filter(
      (j) => j !== parseInt(fileToCancel.fileNumber.replace('#', ''))
    );
  }
  downloadsMap.delete(jobKey);
  removeLogEntry(fileToCancel);
  saveDownloads();
};

export const clearCompletedDl = (fileToClear: DownloadableFile) => {
  const jobKey = buildJobKey(fileToClear);
  if (jobsMap.has(jobKey)) {
    jobsMap.delete(jobKey);
  }
  if (downloadsMap.has(jobKey)) {
    downloadsMap.delete(jobKey);
  }
  removeLogEntry(fileToClear);
  saveDownloads();
};
