import { ForbiddenError, UnauthorizedError } from './errors';
import { authorize, jwtSign, jwtVerify } from './auth';

import bcrypt from 'bcrypt';
import { detail } from 'syft.js';
import http from 'http';
import url from 'url';

export default (db, logger, port) => {
  return http
    .createServer((req, res) => {
      const { pathname, query } = url.parse(req.url, true);

      if (pathname === '/protocols') {
        if (req.method === 'POST') handleRequest(req, res, insert,  db, 'protocols'); // prettier-ignore
        else if (req.method === 'PUT') handleRequest(req, res, update,  db, 'protocols'); // prettier-ignore
        else if (req.method === 'DELETE' && query.id) handleRequest(req, res, remove,  db, 'protocols'); // prettier-ignore
        else handleInvalid(req, res);
      } else if (pathname === '/plans') {
        if (req.method === 'POST') handleRequest(req, res, insert,  db, 'plans'); // prettier-ignore
        else if (req.method === 'PUT') handleRequest(req, res, update,  db, 'plans'); // prettier-ignore
        else if (req.method === 'DELETE' && query.id) handleRequest(req, res, remove,  db, 'plans'); // prettier-ignore
        else handleInvalid(req, res);
      } else if (pathname === '/token') {
        if (req.method === 'POST') handleRequest(req, res, getToken, db); // prettier-ignore
        else handleInvalid(req, res);
      } else {
        handleInvalid(req, res);
      }
    })
    .listen(port, () => {
      logger.log(`HTTP server running on port ${port}, PID: ${process.pid}`);
    });
};

const handleRequest = async (req, res, next, db, ...args) => {
  const { pathname, _ } = url.parse(req.url, true);

  try {
    if (pathname !== '/token') {
      // Check authorization header for JWT token
      await authorize(req, db);
    }

    // Compose the response
    composeResponse(req, res, next, db, ...args);
  } catch (error) {
    res.statusCode = error.statusCode || 401;

    res.end(JSON.stringify({ error: error.message || 'Invalid request' }));
  }
};

const composeResponse = (req, res, next, ...args) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    const { _, query } = url.parse(req.url, true);
    let data = body.length > 0 ? JSON.parse(body) : {};

    // Append query string data, data sent in the body have the highest preference
    data = Object.assign({}, query || {}, data || {});

    res.setHeader('Content-Type', 'application/json');

    try {
      const response = await next(req, res, data, ...args);

      res.statusCode = 200;

      res.end(JSON.stringify(response));
    } catch (error) {
      res.statusCode = error.statusCode || 404;

      res.end(JSON.stringify({ error: error.message || 'Invalid request' }));
    }
  });
};

const insert = async (req, res, data, db, collection) => {
  const detailed = detail(data.data);

  await db
    .collection(collection)
    .insertOne({ id: detailed.id.toString(), contents: data.data });

  return {
    success: `Successfully added ${collection.slice(0, -1)} ${detailed.id}`
  };
};

const update = async (req, res, data, db, collection) => {
  const detailed = detail(data.data);

  await db
    .collection(collection)
    .updateOne(
      { id: detailed.id.toString() },
      { $set: { id: detailed.id.toString(), contents: data.data } },
      { upsert: true }
    );

  return {
    success: `Successfully updated ${collection.slice(0, -1)} ${detailed.id}`
  };
};

const remove = async (req, res, data, db, collection) => {
  await db.collection(collection).deleteOne({ id: data.id });

  return {
    success: `Successfully removed ${collection.slice(0, -1)} ${data.id}`
  };
};

const handleInvalid = (req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Invalid request' }));
};

const getToken = async (req, res, data, db) => {
  const user = await db
    .collection('users')
    .findOne({ username: data.username });

  const isPasswordValid = bcrypt.compareSync(data.password, user.password);
  if (!isPasswordValid) {
    return {};
  }

  return {
    token: jwtSign({ id: user.id })
  };
};
