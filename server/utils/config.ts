import { Params } from 'xdccjs';
import { Server } from '../models';

export const DL_PATH = process.env.DOWNLOAD_PATH || './';

export const DOWNLOADS_FILE_KEY = 'downloads.json';

export const DEFAULT_SERVERS: Server[] = [];

export const generateNewConf = function (
  server: string,
  channel: string
): Params {
  const params: Params = {
    cliMode: false,
    host: server, // IRC hostname                                                   - required
    port: 6667, // IRC port                                                                   - default: 6667
    tls: {
      enable: false, // Enable TLS Support                                                     - default: false
      rejectUnauthorized: false, // Reject self-signed certificates                            - default: false
    },
    nickname: 'dd1985', // Nickname                                                      - default: xdccJS + random
    chan: [channel], // Array of channels                                         - default : [ ] (no chan)
    path: DL_PATH, // Download path or 'false'                                            - default: false (which enables piping)
    retry: 1, // Nb of retries before skip                                                    - default: 1
    timeout: 30, // Nb of seconds before a download is considered timed out                   - default: 30
    verbose: false, // Display download progress and jobs status                               - default: false
    randomizeNick: false, // Add random numbers at end of nickname                            - default: true
    passivePort: [5000, 5001, 5002], // Array of port(s) to use with Passive DCC              - default: [5001]
    botNameMatch: false, // Block downloads if the bot's name does not match the request      - default: true
    throttle: undefined, // Throttle download speed to n KiB/s                                       - default: undefined (disabled)
    queue: /.*coda.*/, //                                                        - default: undefined (disabled)
    // ^ Regex matching the bot's message when you're request is moved to a queue
  };
  return params;
};

export const updateExistingConf = function (
  conf: Params,
  channel: string
): Params {
  const newConf = Object.assign({}, conf, {
    chan: conf.chan.concat(channel),
  });
  return newConf;
};
