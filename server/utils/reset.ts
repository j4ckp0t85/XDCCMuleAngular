import { ResetRequest } from '../models/reset.request.interface';
import { saveDownloads } from './database';
import { downloadsMap, jobsMap } from './download';
import { logsMap } from './log';
import { xdccJsInstancesMap } from './network';

export const reset = (request: ResetRequest) => {
  if (request.deleteAllJobs === true) {
    jobsMap.forEach((job) => job.cancel());
    jobsMap.clear();
    logsMap.clear();
  }
  if (request.closeAllXdccInstances === true) {
    new Array(...xdccJsInstancesMap.values()).forEach((xdccMapEntry) => {
      xdccMapEntry.instance.quit();
    });
    xdccJsInstancesMap.clear();
  }
  if (request.cleanDownloads === true) {
    Array.from(downloadsMap.entries()).forEach(([key, value]) => {
      if (value.status === 'downloaded' || value.status === 'cancelled') {
        downloadsMap.delete(key);
      }
    });
  }
  saveDownloads();
};
