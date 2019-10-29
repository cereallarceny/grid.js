import http from 'http';
import url from 'url';

import { detail } from 'syft.js';

export default (db, logger, port) => {
  return http
    .createServer((req, res) => {
      const { pathname, query } = url.parse(req.url, true);

      if (pathname === '/protocols') {
        if (req.method === 'POST') insert('protocols', req, res, db);
        else if (req.method === 'PUT') update('protocols', req, res, db);
        else if (req.method === 'DELETE' && query.id) remove('protocols', query.id, req, res, db);
        else handleInvalid(req, res);
      } else if (pathname === '/plans') {
        if (req.method === 'POST') insert('plans', req, res, db);
        else if (req.method === 'PUT') update('plans', req, res, db);
        else if (req.method === 'DELETE' && query.id) remove('plans', query.id, req, res, db);
        else handleInvalid(req, res);
      } else {
        handleInvalid(req, res);
      }
    })
    .listen(port, () => {
      logger.log(`HTTP server running on port ${port}, PID: ${process.pid}`);
    });
};

const composeResponse = (req, res, callback) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    const data = body.length > 0 ? JSON.parse(body) : null;
    const response = await callback(data);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
  });
};

const insert = (collection, req, res, db) => {
  composeResponse(req, res, async ({ data }) => {
    const detailed = detail(data);

    await db
      .collection(collection)
      .insertOne({ id: detailed.id.toString(), contents: data });

    return {
      success: `Successfully added ${collection.slice(0, -1)} ${detailed.id}`
    };
  });
};

const update = (collection, req, res, db) => {
  composeResponse(req, res, async ({ data }) => {
    const detailed = detail(data);

    await db
      .collection(collection)
      .updateOne(
        { id: detailed.id.toString() },
        { $set: { id: detailed.id.toString(), contents: data } },
        { upsert: true }
      );

    return {
      success: `Successfully updated ${collection.slice(0, -1)} ${detailed.id}`
    };
  });
};

const remove = (collection, id, req, res, db) => {
  composeResponse(req, res, async () => {
    await db.collection(collection).deleteOne({ id });

    return {
      success: `Successfully removed ${collection.slice(0, -1)} ${id}`
    };
  });
};

const handleInvalid = (req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Invalid request' }));
};
