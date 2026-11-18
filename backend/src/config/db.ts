import mongoose from "mongoose";

export async function connectDb(uri: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    // Fail in 10 seconds (not 30) when the link, password or IP allow-list is wrong.
    serverSelectionTimeoutMS: 10_000,
  });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
