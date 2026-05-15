const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config();

function parseAdminDiscordId(argv) {
  const adminFlagIndex = argv.findIndex((arg) => arg === '--admin');
  const positional = argv.find((arg) => !arg.startsWith('--'));

  if (adminFlagIndex === -1 && !positional) {
    return process.env.ADMIN_DISCORD_USERNAME || process.env.ADMIN_DISCORD_ID || null;
  }

  const value = adminFlagIndex !== -1 ? argv[adminFlagIndex + 1] : positional;
  if (!value || value.startsWith('--')) {
    throw new Error('Valore admin mancante. Esempio: npm run db:bootstrap -- encke_');
  }

  const normalized = value.trim();
  if (!/^[a-z0-9._]{2,64}$/i.test(normalized)) {
    throw new Error('Username admin non valido. Esempio: npm run db:bootstrap -- encke_');
  }

  return normalized;
}

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
  const adminDiscordId = parseAdminDiscordId(process.argv.slice(2));
  const client = new Client(buildClientConfig());

  const schemaPath = path.resolve(__dirname, '../database/schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');

  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(schemaSql);

    if (adminDiscordId) {
      await client.query(
        `INSERT INTO admins (discord_id, role)
         VALUES ($1, 'superadmin')
         ON CONFLICT (discord_id) DO NOTHING`,
        [adminDiscordId]
      );
    }

    await client.query('COMMIT');

    // eslint-disable-next-line no-console
    console.log('Bootstrap DB completato.');
    if (adminDiscordId) {
      // eslint-disable-next-line no-console
      console.log(`Admin iniziale verificato/creato: ${adminDiscordId}`);
    } else {
      // eslint-disable-next-line no-console
      console.log('Nessun admin seed: passa --admin <discordUsername> oppure ADMIN_DISCORD_USERNAME nel .env');
    }
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

