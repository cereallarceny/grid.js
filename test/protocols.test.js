import { Logger } from 'syft.js';

import { getProtocol } from '../src/protocols';
import DBManager from './_db-manager';
import * as protocols from './data/test-protocols'

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
    await db.collection('protocols').insertMany([
      {
        id: protocols.multi_millionaire_problem_protocol_id,
        contents: protocols.multi_millionaire_problem_protocol
      },
      {
        id: protocols.millionaire_problem_protocol_id,
        contents: protocols.millionaire_problem_protocol
      }
    ]);

    await db.collection('plans').insertMany([
      {
        id: protocols.millionaire_problem_plan1_id,
        contents: protocols.millionaire_problem_plan1
      },
      {
        id: protocols.millionaire_problem_plan2_id,
        contents: protocols.millionaire_problem_plan2
      },
      {
        id: protocols.millionaire_problem_plan3_id,
        contents: protocols.millionaire_problem_plan3
      },
    ]);
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
      { workerId: uuid(), protocolId: protocols.millionaire_problem_protocol_id },
      logger
    );
    const getProtocolData = await getProtocol(
      db,
      {
        workerId: Object.keys(creatorProtocolData.participants)[0],
        protocolId: protocols.millionaire_problem_protocol_id,
        scopeId: creatorProtocolData.user.scopeId
      },
      logger
    );

    expect(creatorProtocolData.user.scopeId).not.toBe(null);
    expect(Object.keys(creatorProtocolData.participants).length).toBe(1);
    expect(creatorProtocolData.plan).toBe(protocols.millionaire_problem_plan1);
    expect(getProtocolData.user.scopeId).toBe(creatorProtocolData.user.scopeId);
    expect(getProtocolData.plan).toBe(protocols.millionaire_problem_plan2);
    expect(Object.keys(getProtocolData.participants).length).toBe(1);
  });

  test('should get data if a scopeId is supplied', async () => {
    const creatorProtocolData = await getProtocol(
      db,
      { workerId: uuid(),
        protocolId: protocols.multi_millionaire_problem_protocol_id },
      logger
    );
    const getProtocolData = await getProtocol(
      db,
      {
        workerId: Object.keys(creatorProtocolData.participants)[0],
        protocolId: protocols.multi_millionaire_problem_protocol_id,
        scopeId: creatorProtocolData.user.scopeId
      },
      logger
    );

    expect(creatorProtocolData.user.scopeId).not.toBe(null);
    expect(creatorProtocolData.plan).toBe(protocols.millionaire_problem_plan1);
    expect(Object.keys(creatorProtocolData.participants).length).toBe(2);
    expect(getProtocolData.user.scopeId).toBe(creatorProtocolData.user.scopeId);
    expect(getProtocolData.plan).toBe(protocols.millionaire_problem_plan2);
    expect(Object.keys(getProtocolData.participants).length).toBe(2);
  });
});
