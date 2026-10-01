import { initDb, isUsingInMemory } from '../config/db.js';

export async function runSeed() {
  console.log('--- Starting Database Migration & Seed ---');
  try {
    await initDb(true);
    console.log('✓ Database migrated and seeded successfully.');
    if (!isUsingInMemory()) {
      process.exit(0);
    }
  } catch (err) {
    console.error('✗ Migration/Seed failed:', err.message);
    if (!isUsingInMemory()) {
      process.exit(1);
    }
  }
}

// If executed directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seedService.js')) {
  runSeed();
}
