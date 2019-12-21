import { ForbiddenError, UnauthorizedError } from './errors';
import { jwtExpiry, jwtSecret } from './_constants';

import jwt from 'jsonwebtoken';

// Sign the payload with JWT secret
export const jwtSign = payload => {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: jwtExpiry
  });
};

// Verify the JWT token and get the decoded payload
export const jwtVerify = token => {
  return jwt.verify(token, jwtSecret);
};

export const authorize = async (req, db) => {
  const authHeader = req.headers['authorization'];

  // Check authorization header
  if (!authHeader) {
    throw new UnauthorizedError();
  }

  // Check header format - authorization: JWT token
  const [authType, token] = authHeader.split(' ');

  if (authType !== 'JWT' || !token) {
    throw new UnauthorizedError();
  }

  let decoded;
  try {
    decoded = jwtVerify(token);
  } catch (err) {
    throw new UnauthorizedError();
  }

  if (!decoded || !decoded.id) {
    throw new UnauthorizedError();
  }

  const userExists =
    (await db
      .collection('users')
      .find({ id: decoded.id })
      .count()) > 0;

  if (!userExists) {
    throw new ForbiddenError();
  }

  // Add authorized user object to the request
  req.user = { id: decoded.id };
};
