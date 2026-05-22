const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config();

function buildClientConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'fc26_championship',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  };
}

async function run() {
  const client = new Client(buildClientConfig());

  const schemaPath = path.resolve(__dirname, '../database/schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');

  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');

    // eslint-disable-next-line no-console
    console.log('✅ Schema DB creato/aggiornato.');
    // eslint-disable-next-line no-console
    console.log('💡 Gestione admin: Usa DISCORD_ADMIN_ROLE_ID nel .env');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Errore bootstrap DB:', error.message);
  process.exit(1);
});

