import WebSocket from 'ws';
import Redis from 'redis';
import { MongoClient } from 'mongodb';
import { Logger } from 'syft-helpers.js';

import start from './socket';

// Define the port
const PORT = process.env.PORT || 3000;

// Define our Redis and MongoDB urls
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/grid';

// Define detailed information about MongoDB
const mongoDatabase = mongoUrl.substring(mongoUrl.lastIndexOf('/') + 1);
export const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Create our MongoDB client with this information
const mongo = new MongoClient(mongoUrl, mongoOptions);

// Connect to the DB
mongo.connect().then(() => {
  if (process.env.NODE_ENV !== 'test') {
    // Select the DB we connected to if we have one, otherwise, use 'grid'
    const db = mongo.db(mongoDatabase);

    // Create the WebSocket Server
    const wss = new WebSocket.Server({ port: PORT });

    // Define the Redis port and create the pub/sub clients
    const pub = Redis.createClient(redisUrl);
    const sub = Redis.createClient(redisUrl);

    // Define the Logger
    const logger = new Logger('grid.js', process.env.VERBOSE);

    // Start the server officially, sending in the database and everything else we need
    start(db, wss, pub, sub, logger, PORT);
  }
});
