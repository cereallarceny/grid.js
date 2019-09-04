import WebSocket from 'ws';
import Redis from 'redis';
import { MongoClient } from 'mongodb';
import { Logger } from 'syft-helpers.js';

import start from './socket';

const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';
const DEFAULT_MONGO_URL = 'mongodb://localhost:27017/grid';

// Define the socket port and create the Websocket server
const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

// Define the Redis port and create the pub/sub clients
const redisUrl = process.env.REDIS_URL || DEFAULT_REDIS_URL;
const pub = Redis.createClient(redisUrl);
const sub = Redis.createClient(redisUrl);

// Define the MongoDB connection url
const mongoUrl = process.env.MONGODB_URI || DEFAULT_MONGO_URL;
const mongoDatabase = mongoUrl.substring(mongoUrl.lastIndexOf('/') + 1);
export const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};
const mongo = new MongoClient(mongoUrl, mongoOptions);

// Define the Logger
const logger = new Logger('grid.js', process.env.VERBOSE);

// Connect to the DB
mongo.connect().then(() => {
  // Select the DB we connected to if we have one, otherwise, use 'grid'
  const db = mongo.db(mongoDatabase);

  // Start the server officially, sending in the database and everything else we need
  start(db, wss, pub, sub, logger, port);
});
