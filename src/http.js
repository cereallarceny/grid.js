import http from 'http';
import url from 'url';

import { detail } from 'syft.js';

export default (db, logger, port) => {
  http
    .createServer((req, res) => {
      const { pathname } = url.parse(req.url, true);

      if (pathname == '/protocols') {
        if (req.method === 'POST') insert('protocols', req, res, db);
        else if (req.method === 'PUT') update('protocols', req, res, db);
        else if (req.method === 'DELETE') remove('protocols', req, res, db);
      } else if (pathname == '/plans') {
        if (req.method === 'POST') insert('plans', req, res, db);
        else if (req.method === 'PUT') update('plans', req, res, db);
        else if (req.method === 'DELETE') remove('plans', req, res, db);
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
    const response = await callback(JSON.parse(body));

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
      .insertOne({ id: detailed.id, contents: data });

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
        { id: detailed.id },
        { $set: { id: detailed.id, contents: data } },
        { upsert: true }
      );

    return {
      success: `Successfully updated ${collection.slice(0, -1)} ${detailed.id}`
    };
  });
};

const remove = (collection, req, res, db) => {
  composeResponse(req, res, async ({ id }) => {
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
