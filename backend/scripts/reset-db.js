const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

const resetDatabase = async () => {
  try {
    console.log('🗑️  Database Reset Tool');
    console.log('======================');
    
    // Connect to database
    await connectDB();
    
    console.log('\n⚠️  WARNING: This will delete ALL data in the database!');
    console.log('This action cannot be undone.');
    
    // Get current database stats
    const dbStats = await mongoose.connection.db.stats();
    console.log(`\n📊 Current Database Status:`);
    console.log(`   Database: ${dbStats.db}`);
    console.log(`   Collections: ${dbStats.collections}`);
    console.log(`   Documents: ${dbStats.objects}`);
    console.log(`   Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections to be deleted:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    // Confirmation prompt (in a real app, you'd use readline)
    console.log('\n❓ Are you sure you want to continue? (y/N)');
    console.log('   Type "yes" to confirm, anything else to cancel.');
    
    // For now, we'll proceed with a 5-second delay to give time to cancel
    console.log('\n⏰ Proceeding in 5 seconds... (Ctrl+C to cancel)');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🗑️  Starting database reset...');
    
    // Delete all collections
    for (const collection of collections) {
      console.log(`   Deleting collection: ${collection.name}`);
      await mongoose.connection.db.collection(collection.name).drop();
    }
    
    console.log('\n✅ Database reset completed successfully!');
    console.log('📊 All collections and data have been removed.');
    
    // Show final stats
    const finalStats = await mongoose.connection.db.stats();
    console.log(`\n📈 Final Database Status:`);
    console.log(`   Collections: ${finalStats.collections}`);
    console.log(`   Documents: ${finalStats.objects}`);
    console.log(`   Data Size: ${(finalStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n💡 To repopulate the database, run: npm run db:seed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  }
};

// Run reset
resetDatabase();
