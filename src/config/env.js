const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  discordToken: process.env.DISCORD_TOKEN,
  prefix: process.env.DISCORD_PREFIX || '!',
  discordAdminRoleId: process.env.DISCORD_ADMIN_ROLE_ID,
  db: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || 'fc26_championship',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    databaseUrl: process.env.DATABASE_URL || ''
  }
};

if (!env.discordToken) {
  // Delay errore leggibile fin da boot, evitando runtime ambiguo
  throw new Error('Variabile DISCORD_TOKEN mancante nel file .env');
}

module.exports = env;

