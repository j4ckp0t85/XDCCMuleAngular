import XDCC, { Params } from 'xdccjs';

export interface XDCCMapEntry {
  instance: XDCC;
  conf: Params;
  channelsJoined: string[];
}
