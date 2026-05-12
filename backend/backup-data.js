const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_management';

// Backup directory (project root)
const BACKUP_DIR = path.join(__dirname, '..', 'mongodb_backup');

// Collections to backup
const COLLECTIONS = ['users', 'menus', 'orders', 'bookings', 'payments', 'contacts', 'revenues'];

async function backup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const db = mongoose.connection.db;

    for (const collectionName of COLLECTIONS) {
      try {
        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();
        
        const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`✓ Backed up ${collectionName}: ${data.length} documents`);
      } catch (err) {
        console.log(`✗ Skipped ${collectionName}: ${err.message}`);
      }
    }

    console.log('\n✅ Backup completed!');
    console.log(`📁 Backup saved to: ${BACKUP_DIR}`);
    
  } catch (error) {
    console.error('Backup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function restore() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;

    for (const collectionName of COLLECTIONS) {
      const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`✗ Skipped ${collectionName}: file not found`);
        continue;
      }

      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const collection = db.collection(collectionName);
        
        // Clear existing data
        await collection.deleteMany({});
        
        // Insert backup data
        if (data.length > 0) {
          await collection.insertMany(data);
        }
        
        console.log(`✓ Restored ${collectionName}: ${data.length} documents`);
      } catch (err) {
        console.log(`✗ Failed ${collectionName}: ${err.message}`);
      }
    }

    console.log('\n✅ Restore completed!');
    
  } catch (error) {
    console.error('Restore failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Main
const command = process.argv[2];

if (command === 'backup') {
  backup();
} else if (command === 'restore') {
  restore();
} else {
  console.log('Usage:');
  console.log('  node backup-data.js backup   - Backup all data');
  console.log('  node backup-data.js restore  - Restore all data');
}
