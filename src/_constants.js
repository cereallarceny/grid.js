// Define the port
export const socketPort = parseInt(process.env.PORT) || 3000;

// Define our Redis url
export const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Define detailed information about MongoDB
export const mongoUrl =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/grid';
export const mongoDatabase = mongoUrl.substring(mongoUrl.lastIndexOf('/') + 1);
export const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Define the HTTP server port
export const httpPort = parseInt(process.env.HTTPPORT) || socketPort + 1;

// JWT
export const jwtSecret = process.env.JWT_SECRET || 'my-jwt-secret';
export const jwtExpiry = parseInt(process.env.JWT_EXPIRY) || 86400; // 24 hours
