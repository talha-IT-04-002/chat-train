const mongoose = require('mongoose');
require('dotenv').config();
const { run } = require('../config/database');
const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    const resolvedUri = 'mongodb+srv://talha137:talha137@cluster1.6zzgprx.mongodb.net/'
    console.log(`MongoDB URI: ${resolvedUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    await run();

    console.log('Database connection successful!');

    console.log('Testing basic database operations...');

    const testCollection = mongoose.connection.collection('test');
    await testCollection.insertOne({ test: 'data', timestamp: new Date() });
    console.log('Write operation successful');

    const result = await testCollection.findOne({ test: 'data' });
    console.log('Read operation successful');

    await testCollection.deleteOne({ test: 'data' });
    console.log('Delete operation successful');

    const dbStats = await mongoose.connection.db.stats();
    console.log('Database Information:');
    console.log(`   Database Name: ${dbStats.db}`);
    console.log(`   Collections: ${dbStats.collections}`);
    console.log(`   Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);

    console.log('All database tests passed!');

    process.exit(0);
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    console.error('Make sure MongoDB is running and the connection string is correct.');
    process.exit(1);
  }
};

testDatabaseConnection();