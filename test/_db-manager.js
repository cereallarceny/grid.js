import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mongoOptions } from '../src/_constants';

// Extend the default timeout so MongoDB binaries can download
jest.setTimeout(60000);

const COLLECTIONS = ['protocols', 'plans', 'users'];

export default class DBManager {
  constructor() {
    this.server = new MongoMemoryServer();

    this.connection = null;
    this.db = null;
    this.url = null;
  }

  async start() {
    const url = await this.server.getConnectionString();
    const db = await this.server.getDbName();

    this.connection = await MongoClient.connect(url, mongoOptions);
    this.db = this.connection.db(db);
    this.url = url;
  }

  async stop() {
    await this.connection.close();

    return this.server.stop();
  }

  async cleanup() {
    return Promise.all(
      COLLECTIONS.map(c => this.db.collection(c).deleteMany({}))
    );
  }
}
