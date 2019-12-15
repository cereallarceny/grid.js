import { jwtExpiry, jwtSecret } from './_constants';

// import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Sign the payload with JWT secret
export const jwtSign = payload => {
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: jwtExpiry
  });

  return token;
};

// Verify the JWT token and get the decoded payload
export const jwtVerify = token => {
  const decoded = jwt.verify(token, jwtSecret);

  return decoded;
};
