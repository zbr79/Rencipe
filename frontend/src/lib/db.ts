import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

const globalWithMongoose = globalThis as typeof globalThis & { mongoose?: MongooseCache };
const cached: MongooseCache = globalWithMongoose.mongoose ?? {
    conn: null,
    promise: null,
  };
globalWithMongoose.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
