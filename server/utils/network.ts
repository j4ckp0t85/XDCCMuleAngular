import XDCC, { Params } from 'xdccjs';
import { saveDownloads } from './database';
import { downloadsMap } from './download';

export const xdccJsInstancesMap = new Map<
  string,
  { instance: XDCC; conf: Params; channelsJoined: string[] }
>();

export const instances = () => Array.from(xdccJsInstancesMap.keys());

export const quitInstance = (network: string) => {
  const xdccMapEntry = xdccJsInstancesMap.get(network);
  if (xdccMapEntry) {
    xdccMapEntry.instance.quit();
    xdccJsInstancesMap.delete(network);
    const keys = Array.from(downloadsMap.keys()).filter((key) => {
      key.includes(network);
    });
    if (keys.length > 0) {
      keys?.forEach((key) => downloadsMap.delete(key));
      saveDownloads();
    }
  }
};
