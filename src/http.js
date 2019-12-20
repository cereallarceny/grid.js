import { CredentialsDidNotMatchError, NotFoundError } from './errors';
import { authorize, jwtSign } from './auth';

import bcrypt from 'bcrypt';
import { detail } from 'syft.js';
import http from 'http';
import url from 'url';

export default (db, logger, port) => {
  return http
    .createServer((req, res) => {
      const { pathname, _ } = url.parse(req.url, true);

      if (pathname === '/protocols') {
        if (req.method === 'POST') handleRequest(req, res, insert,  db, 'protocols'); // prettier-ignore
        else if (req.method === 'PUT') handleRequest(req, res, update,  db, 'protocols'); // prettier-ignore
        else if (req.method === 'DELETE') handleRequest(req, res, remove,  db, 'protocols'); // prettier-ignore
        else handleInvalidMethod(req, res);
      } else if (pathname === '/plans') {
        if (req.method === 'POST') handleRequest(req, res, insert,  db, 'plans'); // prettier-ignore
        else if (req.method === 'PUT') handleRequest(req, res, update,  db, 'plans'); // prettier-ignore
        else if (req.method === 'DELETE') handleRequest(req, res, remove,  db, 'plans'); // prettier-ignore
        else handleInvalidMethod(req, res);
      } else if (pathname === '/token') {
        if (req.method === 'POST') handleRequest(req, res, getToken, db); // prettier-ignore
        else handleInvalidMethod(req, res);
      } else {
        handleInvalidUrl(req, res);
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

  await db.collection(collection).insertOne({
    id: detailed.id.toString(),
    contents: data.data,
    createdBy: req.user.id
  });

  return {
    success: `Successfully added ${collection.slice(0, -1)} ${detailed.id}`
  };
};

const update = async (req, res, data, db, collection) => {
  const detailed = detail(data.data);

  await db
    .collection(collection)
    .updateOne(
      { id: detailed.id.toString(), createdBy: req.user.id },
      { $set: { id: detailed.id.toString(), contents: data.data } }
    );

  return {
    success: `Successfully updated ${collection.slice(0, -1)} ${detailed.id}`
  };
};

const remove = async (req, res, data, db, collection) => {
  const result = await db
    .collection(collection)
    .deleteOne({ id: data.id, createdBy: req.user.id });

  if (result.deletedCount === 0) {
    throw new NotFoundError();
  }

  return {
    success: `Successfully removed ${collection.slice(0, -1)} ${data.id}`
  };
};

const handleInvalidMethod = (req, res) => {
  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Method Not Allowed' }));
};

const handleInvalidUrl = (req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not Found' }));
};

const getToken = async (req, res, data, db) => {
  const user = await db
    .collection('users')
    .findOne({ username: data.username });

  if (!user) {
    throw new CredentialsDidNotMatchError();
  }

  // Authenticate
  const isPasswordValid = bcrypt.compareSync(data.password, user.password);
  if (!isPasswordValid) {
    throw new CredentialsDidNotMatchError();
  }

  return {
    token: jwtSign({ id: user.id })
  };
};
