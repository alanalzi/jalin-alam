import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // In development, allow mongoose to auto-create indexes so unique constraints
      // from the schema (e.g. email: { unique: true }) are applied automatically.
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Mongoose connected');
        return mongoose;
      })
      .catch((err) => {
        console.error('Mongoose connection error:', err);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
