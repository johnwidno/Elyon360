const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => {
    console.log('Connected successfully to Render DB');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Time from DB:', res.rows[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
