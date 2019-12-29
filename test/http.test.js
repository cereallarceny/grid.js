import { examplePlans, exampleProtocols } from '../seed/samples';

import DBManager from './_db-manager';
import { Logger } from '@openmined/syft.js';
import bcrypt from 'bcrypt';
import http from 'http';
import httpStart from '../src/http';

const uuid = require('uuid/v4');
const testPort = 3005;
const testUsername = 'tester';
const testUserPassword = 'test-password';

// Helper function to make HTTP requests.
const request = async (url, options = {}, data = null) => {
  return new Promise(resolve => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: testPort,
        path: url,
        method: data ? 'POST' : 'GET',
        ...options
      },
      response => {
        const data = {
          statusCode: response.statusCode,
          body: '',
          headers: response.headers
        };
        response.on('data', _data => (data.body += _data));
        response.on('end', () => {
          data.body = JSON.parse(data.body);
          resolve(data);
        });
      }
    );

    req.on('error', e => {
      console.error(`problem with request: ${e.message}`);
    });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

describe('HTTP Server', () => {
  let manager, db, logger, loggerSpy, server, token;

  beforeAll(async done => {
    logger = new Logger('http', true);

    // Spy on all logger calls.
    loggerSpy = jest.spyOn(Logger.prototype, 'log');

    manager = new DBManager();
    await manager.start();
    db = manager.db;

    // Start HTTP server.
    server = httpStart(db, logger, testPort);
    server.on('listening', done);
  });

  afterAll(async done => {
    jest.resetAllMocks();
    server.close(done);
  });

  beforeEach(async () => {
    // Insert admin user
    await db.collection('users').insertOne({
      id: uuid(),
      username: testUsername,
      password: bcrypt.hashSync(testUserPassword, 10)
    });

    const response = await request(
      '/token',
      { method: 'POST' },
      { username: testUsername, password: testUserPassword }
    );

    token = response.body.token;
  });

  afterEach(async () => {
    // Reset test DB after each test.
    await manager.cleanup();
  });

  test('should start on specified port', async () => {
    expect(server.listening).toBe(true);
    expect(loggerSpy.mock.calls).toHaveLength(1);
    expect(loggerSpy.mock.calls[0][0]).toContain(
      `HTTP server running on port ${testPort}`
    );
  });

  test('should return 404 for unknown url', async () => {
    const response = await request('/non-existing');
    expect(response.statusCode).toBe(404);
    expect(response.body).toStrictEqual({ error: 'Not Found' });
  });

  test('should return 405 for non existing method', async () => {
    const response = await request('/protocols');
    expect(response.statusCode).toBe(405);
    expect(response.body).toStrictEqual({ error: 'Method Not Allowed' });
  });

  test('should be able to add protocol', async () => {
    const response = await request(
      '/protocols',
      { headers: { authorization: `JWT ${token}` } },
      { data: exampleProtocols[0].contents }
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({
      success: `Successfully added protocol ${exampleProtocols[0].id}`
    });
    const savedProtocol = await db
      .collection('protocols')
      .findOne({ id: exampleProtocols[0].id });
    expect(savedProtocol.contents).toBe(exampleProtocols[0].contents);
  });

  test('should be able to update protocol', async () => {
    await request(
      '/protocols',
      { headers: { authorization: `JWT ${token}` } },
      { data: exampleProtocols[0].contents }
    );
    const updatedProtocol = exampleProtocols[0].contents.replace(
      /assignment/g,
      'job'
    );
    const response = await request(
      '/protocols',
      { method: 'PUT', headers: { authorization: `JWT ${token}` } },
      { data: updatedProtocol }
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({
      success: `Successfully updated protocol ${exampleProtocols[0].id}`
    });
    const savedProtocol = await db
      .collection('protocols')
      .findOne({ id: exampleProtocols[0].id });
    expect(savedProtocol.contents).toBe(updatedProtocol);
  });

  test('should be able to remove protocol', async () => {
    await request(
      '/protocols',
      { headers: { authorization: `JWT ${token}` } },
      { data: exampleProtocols[0].contents }
    );
    expect(
      await db.collection('protocols').findOne({ id: exampleProtocols[0].id })
    ).not.toBe(null);

    // Request without id.
    const response404 = await request(`/protocols`, {
      method: 'DELETE',
      headers: { authorization: `JWT ${token}` }
    });
    expect(response404.statusCode).toBe(404);
    expect(
      await db.collection('protocols').findOne({ id: exampleProtocols[0].id })
    ).not.toBe(null);

    // Request with non-existing id.
    const responseNonExisting = await request(`/protocols?id=123`, {
      method: 'DELETE',
      headers: { authorization: `JWT ${token}` }
    });
    expect(responseNonExisting.statusCode).toBe(404);
    expect(
      await db.collection('protocols').findOne({ id: exampleProtocols[0].id })
    ).not.toBe(null);

    // Request with real id.
    const response = await request(`/protocols?id=${exampleProtocols[0].id}`, {
      method: 'DELETE',
      headers: { authorization: `JWT ${token}` }
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({
      success: `Successfully removed protocol ${exampleProtocols[0].id}`
    });
    expect(
      await db.collection('plans').findOne({ id: exampleProtocols[0].id })
    ).toBe(null);
  });

  test('should be able to add plan', async () => {
    const response = await request(
      '/plans',
      { headers: { authorization: `JWT ${token}` } },
      { data: examplePlans[0].contents }
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({
      success: `Successfully added plan ${examplePlans[0].id}`
    });
    const savedProtocol = await db
      .collection('plans')
      .findOne({ id: examplePlans[0].id });
    expect(savedProtocol.contents).toBe(examplePlans[0].contents);
  });

  test('should be able to update plan', async () => {
    await request(
      '/plans',
      { headers: { authorization: `JWT ${token}` } },
      { data: examplePlans[0].contents }
    );
    const updatedPlan = examplePlans[0].contents.replace(/dan/g, 'alice');

    const response = await request(
      '/plans',
      { method: 'PUT', headers: { authorization: `JWT ${token}` } },
      { data: updatedPlan }
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({
      success: `Successfully updated plan ${examplePlans[0].id}`
    });
    const savedProtocol = await db
      .collection('plans')
      .findOne({ id: examplePlans[0].id });
    expect(savedProtocol.contents).toBe(updatedPlan);
  });

  test('should be able to remove plan', async () => {
    await request(
      '/plans',
      { headers: { authorization: `JWT ${token}` } },
      { data: examplePlans[0].contents }
    );
    expect(
      await db.collection('plans').findOne({ id: examplePlans[0].id })
    ).not.toBe(null);

    // Request without id.
    const response404 = await request(`/plans`, {
      method: 'DELETE',
      headers: { authorization: `JWT ${token}` }
    });

    expect(response404.statusCode).toBe(404);
    expect(
      await db.collection('plans').findOne({ id: examplePlans[0].id })
    ).not.toBe(null);

    // Request with non-existing id.
    const responseNonExisting = await request(`/plans?id=123`, {
      method: 'DELETE',
      headers: { authorization: `JWT ${token}` }
    });
    expect(responseNonExisting.statusCode).toBe(404);
    expect(
      await db.collection('plans').findOne({ id: examplePlans[0].id })
    ).not.toBe(null);

    // Request with real id.
    const response = await request(`/plans?id=${examplePlans[0].id}`, {
      method: 'DELETE',
      headers: { authorization: `JWT ${token}` }
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({
      success: `Successfully removed plan ${examplePlans[0].id}`
    });
    expect(
      await db.collection('plans').findOne({ id: examplePlans[0].id })
    ).toBe(null);
  });

  test('should be able get token', async () => {
    let response = await request(
      '/token',
      { method: 'POST' },
      { username: testUsername, password: testUserPassword }
    );

    expect(response.body.token).not.toBe(null);
    expect(response.body.username).toBe(testUsername);

    // Request without username.
    response = await request(
      `/token`,
      { method: 'POST' },
      { password: testUserPassword }
    );

    expect(response.statusCode).toBe(401);

    // Request without password.
    response = await request(
      `/token`,
      { method: 'POST' },
      { username: testUsername }
    );

    expect(response.statusCode).toBe(401);

    // Request without username and password.
    response = await request(`/token`, { method: 'POST' }, {});

    expect(response.statusCode).toBe(401);

    // Request with wrong username.
    response = await request(
      `/token`,
      { method: 'POST' },
      { username: 'test1234' }
    );

    expect(response.statusCode).toBe(401);

    // Request with wrong password.
    response = await request(
      `/token`,
      { method: 'POST' },
      { username: testUsername, password: 'something-else' }
    );

    expect(response.statusCode).toBe(401);
  });
});
