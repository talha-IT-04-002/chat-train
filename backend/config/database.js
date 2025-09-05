const mongoose = require('mongoose');

const DEFAULT_URI = "mongodb+srv://talha137:talha137@cluster1.o3ucvuu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1";
async function run() {
  let uri = process.env.MONGODB_URI || DEFAULT_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const parsed = new URL(uri);
    if (!parsed.pathname || parsed.pathname === '/' || parsed.pathname === '') {
      parsed.pathname = '/Chat-Train';
      uri = parsed.toString();
    }
  } catch (_) {
    if (!/\/[A-Za-z0-9._-]+(\?|$)/.test(uri)) {
      if (uri.endsWith('/')) uri += 'Chat-Train'; else uri += '/Chat-Train';
    }
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    autoIndex: true
  });
  console.log('✅ Connected to MongoDB via Mongoose');
}

async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

module.exports = { run, disconnect };