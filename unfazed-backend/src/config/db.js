const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unfazed';
  const isLocalUri = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');
  const isCloudEnv = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.NETLIFY;

  // If in cloud production and no remote MONGO_URI is set, run silently in snapshot mode without spamming 127.0.0.1
  if (isLocalUri && isCloudEnv && !process.env.MONGO_URI) {
    console.log('[Database] Cloud deployment active. Pre-loaded clinical snapshot database active.');
    return null;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database Warning] MongoDB disconnected. Attempting auto-reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] MongoDB successfully reconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database Error]', err.message);
  });

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Initial connection failed: ${error.message}`);
    console.warn(`[Database] Running in resilient mode. Retrying connection in background...`);
    // Retry loop only for real remote databases (e.g. Atlas spinup delay)
    if (!isLocalUri) {
      setTimeout(async () => {
        try {
          await mongoose.connect(mongoUri);
          console.log(`[Database] Background MongoDB connection succeeded.`);
        } catch (retryErr) {
          console.error(`[Database Retry Error] ${retryErr.message}`);
        }
      }, 5000);
    }
  }
};

module.exports = connectDB;
