// src/index.js
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import isOnline from 'is-online';
import fs from 'fs';
import https from 'https';
import { cancel, clearCompletedDl, download, statuses } from './utils/download';
import { extractDatabaseInfo, markAllAsError } from './utils/database';
import { getLogs } from './utils/log';
import { instances, quitInstance } from './utils/network';

import { reset } from './utils/reset';
import { DEFAULT_SERVERS } from './utils/config';
import { DownloadableFile, ResetRequest } from './models';

dotenv.config();

const app: Express = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors());

// Middleware to check internet connection
app.use(async (req, res, next) => {
  try {
      const online = await isOnline();

      if (!online) {
          markAllAsError();
          // Perform any actions when the internet is down
          console.log('Internet connection is down. Performing fallback actions.');
          // You can send a response or handle it in other ways
          return res.status(503).send('Internet connection is down. Please try again later.');
      }

      // If online, proceed to the next middleware or route
      next();
  } catch (error) {
      console.error('Error checking internet connection:', error);
      res.status(500).send('Internal server error.');
  }
});

app.post('/fetchdb', async (req, res) => {
  const { dburl } = req.body;
  try {
    const httpres = await fetch(dburl);
    if (httpres.ok) {
      const textNonFormatted = await httpres.text();
      if (typeof textNonFormatted === 'string') {
        res.send(extractDatabaseInfo(textNonFormatted));
        return;
      }
      res.send(DEFAULT_SERVERS);
    } else {
      res.send(DEFAULT_SERVERS);
    }
  } catch (e) {
    console.log('error fetching db list from url ' + dburl);
    res.send(DEFAULT_SERVERS);
  }
});

app.get('/downloadlist', (req, res) => {
  const { status } = req.query;
  const downloads = statuses();

  const list =
    status !== 'all'
      ? downloads.filter((download) => download.status === status)
      : downloads;
  res.send(list);
});

app.post('/download', (req, res) => {
  const { bot, channel, fileName, fileSize, packageId, server } = req.body;
  const fileToDownload: DownloadableFile = {
    channelName: channel,
    network: server,
    fileNumber: packageId,
    botName: bot,
    fileName: fileName,
    fileSize: fileSize,
  };
  download(fileToDownload);
  res.sendStatus(204);
});

app.post('/cancel', (req, res) => {
  const { botName, channelName, fileNumber, fileName, fileSize, network } =
    req.body;
  const fileToCancel: DownloadableFile = {
    channelName,
    network,
    fileNumber,
    botName,
    fileName,
    fileSize,
  };
  cancel(fileToCancel);
  res.sendStatus(204);
});

app.post('/clearcompleted', (req, res) => {
  const { botName, channelName, fileNumber, fileName, fileSize, network } =
    req.body;
  const fileToClear: DownloadableFile = {
    channelName,
    network,
    fileNumber,
    botName,
    fileName,
    fileSize,
  };
  clearCompletedDl(fileToClear);
  res.sendStatus(204);
});

app.post('/logs', (req, res) => {
  const { botName, channelName, fileNumber, fileName, fileSize, network } =
    req.body;
  const file: DownloadableFile = {
    channelName,
    network,
    fileNumber,
    botName,
    fileName,
    fileSize,
  };
  res.send(getLogs(file));
});

app.get('/activeinstances', (req, res) => {
  res.send([...instances()]);
});

app.post('/quitinstance', (req, res) => {
  const { network } = req.body;
  quitInstance(network);
  res.sendStatus(204);
});

app.post('/reset', (req, res) => {
  const resetRequest: ResetRequest = req.body;
  reset(resetRequest);
  res.sendStatus(204);
});

app.post('/search', async (req, res) => {
  const { webUrl, searchText } = req.body;
  try {
    const httpres = await fetch(`${webUrl}?q=${searchText}`);
    if (httpres.ok) {
      const textNonFormatted = await httpres.text();
      if (textNonFormatted !== '') {
        res.send(textNonFormatted);
      } else {
        res.sendStatus(400);
      }
    } else {
      res.sendStatus(500);
    }
  } catch (e) {
    res.sendStatus(404);
  }
});

const credentials = {
  key: fs.readFileSync('ca-key.pem'),
  cert: fs.readFileSync('ca.pem')
};

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(8443, () => {
  console.log('Server listening on port 8443');
});

