/**
 * Script to clean up duplicate swipes in the database
 * Run this script to fix the redundant profiles issue in likes received
 */

import { matchingService } from '../services/matchingService.js';
import { db } from '../config/database.js';

async function cleanupDuplicateSwipes() {
  try {
    console.log('🧹 Starting cleanup of duplicate swipes...');
    console.log('This will remove duplicate swipes from the database to fix redundant profiles in likes received.');
    
    const result = await matchingService.cleanupDuplicateSwipes();
    
    console.log(`✅ Cleanup completed successfully!`);
    console.log(`📊 Removed ${result.removed} duplicate swipes`);
    
    if (result.removed > 0) {
      console.log('🎉 The redundant profiles issue should now be fixed!');
    } else {
      console.log('ℹ️ No duplicate swipes were found.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDuplicateSwipes()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
