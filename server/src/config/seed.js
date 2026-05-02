require('dotenv').config({ path: '../../.env' }); // Load from root
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function seed() {
  try {
    console.log('Running schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    // split by ';' and run individually
    const schemaQueries = schemaSql.split(';').filter(q => q.trim().length > 0);
    for (let q of schemaQueries) {
      await pool.query(q);
    }

    console.log('Running seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    const seedQueries = seedSql.split(';').filter(q => q.trim().length > 0);
    for (let q of seedQueries) {
      await pool.query(q);
    }
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();
