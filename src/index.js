import WebSocket from 'ws';
import Redis from 'redis';
import { MongoClient } from 'mongodb';
import { Logger } from '@openmined/syft.js';

import {
  socketPort,
  redisUrl,
  mongoUrl,
  mongoDatabase,
  mongoOptions,
  httpPort
} from './_constants';
import socketStart from './socket';
import httpStart from './http';

// Create the WebSocket Server
export const wss = new WebSocket.Server({ port: socketPort });

// Create our MongoDB client with this information
const mongo = new MongoClient(mongoUrl, mongoOptions);

// Connect to the DB
mongo.connect().then(() => {
  // Select the DB we connected to if we have one, otherwise, use 'grid'
  const db = mongo.db(mongoDatabase);

  // Define the Redis port and create the pub/sub clients
  const pub = Redis.createClient(redisUrl);
  const sub = Redis.createClient(redisUrl);

  // Define the Logger
  const logger = new Logger('grid.js', process.env.VERBOSE);

  // Start the socket server, sending in the database and everything else we need
  socketStart(db, wss, pub, sub, logger, socketPort);

  // Start the HTTP server, sending in the database and everything else we need
  httpStart(db, logger, httpPort);
});
