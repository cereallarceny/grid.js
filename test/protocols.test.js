import { examplePlans, exampleProtocols } from '../seed/samples';

import DBManager from './_db-manager';
import { Logger } from 'syft.js';
import { getProtocol } from '../src/protocols';

const uuid = require('uuid/v4');

describe('Protocol', () => {
  let db, manager, logger;

  beforeAll(async () => {
    manager = new DBManager();

    await manager.start();
    db = manager.db;

    logger = new Logger('grid.js', true);
  });

  afterAll(async () => {
    await manager.stop();
    db = null;

    manager = null;
    logger = null;
  });

  beforeEach(async () => {
    await db.collection('protocols').insertMany(exampleProtocols);
    await db.collection('plans').insertMany(examplePlans);
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  test('should error out if a protocolId is not supplied', async () => {
    await expect(getProtocol(db, {}, logger)).rejects.toThrow(
      new Error('Please supply a protocolId')
    );
  });

  test('should error out if protocol does not exist', async () => {
    const protocolId = 'billionaire-problem';

    await expect(getProtocol(db, { protocolId }, logger)).rejects.toThrow(
      new Error(`Cannot find protocol ${protocolId}`)
    );
  });

  test('should create a scope if one is not supplied', async () => {
    const creatorProtocolData = await getProtocol(
      db,
      {
        workerId: uuid(),
        protocolId: exampleProtocols[0].id
      },
      logger
    );
    const getProtocolData = await getProtocol(
      db,
      {
        workerId: Object.keys(creatorProtocolData.participants)[0],
        protocolId: exampleProtocols[0].id,
        scopeId: creatorProtocolData.worker.scopeId
      },
      logger
    );

    expect(creatorProtocolData.worker.scopeId).not.toBe(null);
    expect(Object.keys(creatorProtocolData.participants).length).toBe(2);
    expect(creatorProtocolData.plan).toBe(examplePlans[0].contents);
    expect(getProtocolData.worker.scopeId).toBe(
      creatorProtocolData.worker.scopeId
    );
    expect(getProtocolData.plan).toBe(examplePlans[1].contents);
    expect(Object.keys(getProtocolData.participants).length).toBe(2);
  });

  test('should get data if a scopeId is supplied', async () => {
    const creatorProtocolData = await getProtocol(
      db,
      {
        workerId: uuid(),
        protocolId: exampleProtocols[0].id
      },
      logger
    );
    const getProtocolData = await getProtocol(
      db,
      {
        workerId: Object.keys(creatorProtocolData.participants)[0],
        protocolId: exampleProtocols[0].id,
        scopeId: creatorProtocolData.worker.scopeId
      },
      logger
    );

    expect(creatorProtocolData.worker.scopeId).not.toBe(null);
    expect(creatorProtocolData.plan).toBe(examplePlans[0].contents);
    expect(Object.keys(creatorProtocolData.participants).length).toBe(2);
    expect(getProtocolData.worker.scopeId).toBe(
      creatorProtocolData.worker.scopeId
    );
    expect(getProtocolData.plan).toBe(examplePlans[1].contents);
    expect(Object.keys(getProtocolData.participants).length).toBe(2);
  });
});
