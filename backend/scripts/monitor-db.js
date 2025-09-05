const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

const monitorDatabase = async () => {
  try {
    console.log('📊 Database Monitoring Dashboard');
    console.log('================================');
    
    // Connect to database
    await connectDB();
    
    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    
    console.log('\n📈 Database Statistics:');
    console.log(`   Database: ${dbStats.db}`);
    console.log(`   Collections: ${dbStats.collections}`);
    console.log(`   Documents: ${dbStats.objects}`);
    console.log(`   Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Get collection stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📋 Collection Details:');
    for (const collection of collections) {
      const stats = await mongoose.connection.db.collection(collection.name).stats();
      console.log(`   ${collection.name}:`);
      console.log(`     Documents: ${stats.count}`);
      console.log(`     Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`     Indexes: ${stats.nindexes}`);
    }
    
    // Check connection status
    const readyState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log('\n🔗 Connection Status:');
    console.log(`   Status: ${states[readyState]}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    
    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    const startTime = Date.now();
    
    // Test read performance
    const readStart = Date.now();
    await mongoose.connection.db.collection('users').findOne({});
    const readTime = Date.now() - readStart;
    
    // Test write performance
    const writeStart = Date.now();
    await mongoose.connection.db.collection('test_performance').insertOne({
      test: 'performance',
      timestamp: new Date()
    });
    const writeTime = Date.now() - writeStart;
    
    // Clean up test data
    await mongoose.connection.db.collection('test_performance').deleteOne({
      test: 'performance'
    });
    
    console.log(`   Read Latency: ${readTime}ms`);
    console.log(`   Write Latency: ${writeTime}ms`);
    console.log(`   Total Test Time: ${Date.now() - startTime}ms`);
    
    // Health check
    console.log('\n🏥 Health Check:');
    const healthChecks = [];
    
    // Check if we can read
    try {
      await mongoose.connection.db.collection('users').findOne({});
      healthChecks.push('✅ Read operations working');
    } catch (error) {
      healthChecks.push('❌ Read operations failed');
    }
    
    // Check if we can write
    try {
      await mongoose.connection.db.collection('test_health').insertOne({ test: true });
      await mongoose.connection.db.collection('test_health').deleteOne({ test: true });
      healthChecks.push('✅ Write operations working');
    } catch (error) {
      healthChecks.push('❌ Write operations failed');
    }
    
    // Check connection stability
    if (readyState === 1) {
      healthChecks.push('✅ Connection stable');
    } else {
      healthChecks.push('❌ Connection unstable');
    }
    
    healthChecks.forEach(check => console.log(`   ${check}`));
    
    console.log('\n🎉 Database monitoring completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database monitoring failed:', error.message);
    process.exit(1);
  }
};

// Run monitoring
monitorDatabase();
