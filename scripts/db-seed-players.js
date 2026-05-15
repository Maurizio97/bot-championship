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
  const sqlPath = path.resolve(__dirname, '../database/seed-players.sql');
  const sql = await fs.readFile(sqlPath, 'utf8');
  const client = new Client(buildClientConfig());

  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    const result = await client.query('SELECT COUNT(*)::int AS total FROM players');
    const totalPlayers = result.rows[0]?.total || 0;

    // eslint-disable-next-line no-console
    console.log(`Seed giocatori completato. Totale players: ${totalPlayers}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Errore seed players:', error.message);
  process.exit(1);
});

