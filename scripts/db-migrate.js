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

async function loadMigrationFiles(migrationsDir) {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
}

async function run() {
  const migrationsDir = path.resolve(__dirname, '../database/migrations');
  const migrationFiles = await loadMigrationFiles(migrationsDir);

  if (migrationFiles.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Nessuna migration SQL trovata in database/migrations.');
    return;
  }

  const client = new Client(buildClientConfig());
  await client.connect();

  try {
    for (const fileName of migrationFiles) {
      const filePath = path.join(migrationsDir, fileName);
      const sql = await fs.readFile(filePath, 'utf8');

      // eslint-disable-next-line no-console
      console.log(`>> Eseguo migration: ${fileName}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration fallita (${fileName}): ${error.message}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log('✅ Migrazioni completate.');
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Errore migrazioni DB:', error.message);
  process.exit(1);
});

