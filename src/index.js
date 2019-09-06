import WebSocket from 'ws';
import Redis from 'redis';
import { MongoClient } from 'mongodb';
import { Logger } from 'syft-helpers.js';

import {
  port,
  redisUrl,
  mongoUrl,
  mongoDatabase,
  mongoOptions
} from './_constants';
import start from './socket';

// Create the WebSocket Server
const wss = new WebSocket.Server({ port });

// Define the Redis port and create the pub/sub clients
const pub = Redis.createClient(redisUrl);
const sub = Redis.createClient(redisUrl);

// Define the Logger
const logger = new Logger('grid.js', process.env.VERBOSE);

// Create our MongoDB client with this information
const mongo = new MongoClient(mongoUrl, mongoOptions);

// Connect to the DB
mongo.connect().then(() => {
  // Select the DB we connected to if we have one, otherwise, use 'grid'
  const db = mongo.db(mongoDatabase);

  // Start the server officially, sending in the database and everything else we need
  start(db, wss, pub, sub, logger, port);
});
