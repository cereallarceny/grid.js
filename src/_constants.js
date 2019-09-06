// Define the port
export const port = process.env.PORT || 3000;

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
