import { Logger } from 'syft-helpers.js';

import { getPlans } from '../src/plans';
import DBManager from './_db-manager';

const uuid = require('uuid/v4');

describe('Plan', () => {
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
        id: 'multiple-millionaire-problem',
        plans: [['a1', 'a2', 'a3'], ['b1', 'b2', 'b3'], ['c1', 'c2', 'c3']]
      },
      {
        id: 'millionaire-problem',
        plans: [['a1', 'a2', 'a3'], ['b1', 'b2', 'b3']]
      }
    ]);
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  test('should error out if a protocolId is not supplied', async () => {
    await expect(getPlans(db, {}, logger)).rejects.toThrow(
      new Error('Please supply a protocolId')
    );
  });

  test('should error out if protocol does not exist', async () => {
    const protocolId = 'billionaire-problem';

    await expect(getPlans(db, { protocolId }, logger)).rejects.toThrow(
      new Error(`Cannot find protocol ${protocolId}`)
    );
  });

  test('should create a scope if one is not supplied', async () => {
    const creatorPlanData = await getPlans(
      db,
      { instanceId: uuid(), protocolId: 'millionaire-problem' },
      logger
    );
    const getPlanData = await getPlans(
      db,
      {
        instanceId: creatorPlanData.participants[0],
        protocolId: 'millionaire-problem',
        scopeId: creatorPlanData.user.scopeId
      },
      logger
    );

    expect(creatorPlanData.user.scopeId).not.toBe(null);
    expect(creatorPlanData.plans.length).toBe(3);
    expect(creatorPlanData.participants.length).toBe(1);
    expect(getPlanData.user.scopeId).toBe(creatorPlanData.user.scopeId);
    expect(getPlanData.plans.length).toBe(3);
    expect(getPlanData.participants.length).toBe(1);
  });

  test('should get data if a scopeId is supplied', async () => {
    const creatorPlanData = await getPlans(
      db,
      { instanceId: uuid(), protocolId: 'multiple-millionaire-problem' },
      logger
    );
    const getPlanData = await getPlans(
      db,
      {
        instanceId: creatorPlanData.participants[0],
        protocolId: 'multiple-millionaire-problem',
        scopeId: creatorPlanData.user.scopeId
      },
      logger
    );

    expect(creatorPlanData.user.scopeId).not.toBe(null);
    expect(creatorPlanData.plans.length).toBe(3);
    expect(creatorPlanData.participants.length).toBe(2);
    expect(getPlanData.user.scopeId).toBe(creatorPlanData.user.scopeId);
    expect(getPlanData.plans.length).toBe(3);
    expect(getPlanData.participants.length).toBe(2);
  });
});
