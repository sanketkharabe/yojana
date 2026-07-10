const pool = require('./db');

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL database!');
    const res = await client.query('SELECT NOW()');
    console.log('Current Database Time:', res.rows[0].now);
    
    const count = await client.query('SELECT COUNT(*) FROM schemes');
    console.log(`Found ${count.rows[0].count} schemes in the database.`);
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to connect to the database!');
    console.error(err.message);
    process.exit(1);
  }
}

testConnection();
