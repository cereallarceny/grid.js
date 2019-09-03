import WebSocket from 'ws';
import Redis from 'redis';
import { MongoClient as mongo } from 'mongodb';
import { Logger } from 'syft-helpers.js';

import start from './socket';

const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';
const DEFAULT_MONGO_URL = 'mongodb://localhost:27017';

// Define the socket port and create the Websocket server
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// Define the Redis port and create the pub/sub clients
const redisUrl = process.env.REDIS_URL || DEFAULT_REDIS_URL;
const pub = Redis.createClient(redisUrl);
const sub = Redis.createClient(redisUrl);

// Define the MongoDB connection url
const mongoUrl = process.env.MONGODB_URI || DEFAULT_MONGO_URL;

const logger = new Logger('grid.js', process.env.VERBOSE);

// Initialize database
mongo.connect(mongoUrl, (err, client) => {
  if (err) {
    logger.log('Cannot connect to MongoDB', err);

    return;
  }

  // If we have a successful connection
  if (client) {
    // Select the DB we connected to if we have one, otherwise, use 'grid'
    const db = client.db(
      mongoUrl === DEFAULT_MONGO_URL
        ? 'grid'
        : mongoUrl.substring(mongoUrl.lastIndexOf('/') + 1)
    );

    // Start the server officially, sending in the database and everything else we need
    start(db, wss, pub, sub, logger, port);
  }
});
