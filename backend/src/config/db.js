const mongoose = require('mongoose');

let connectionPromise = null;
mongoose.set('bufferCommands', false);

const getDbState = () => mongoose.connection.readyState;
const isDbConnected = () => getDbState() === 1;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  if (isDbConnected()) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise.then(() => mongoose.connection);
};

module.exports = { connectDB, isDbConnected, getDbState };
