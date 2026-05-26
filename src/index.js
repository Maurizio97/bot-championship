const { Client, GatewayIntentBits } = require('discord.js');
const env = require('./config/env');
const { initDatabase } = require('./database/init');
const readyEvent = require('./events/ready');
const messageCreateEvent = require('./events/messageCreate');
const { startHealthServer } = require('./server/healthServer');

startHealthServer();

process.on('unhandledRejection', console.error);
async function bootstrap() {
  // await initDatabase();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
  });

  client.once(readyEvent.name, (...args) => readyEvent.execute(...args));
  client.on(messageCreateEvent.name, (...args) => messageCreateEvent.execute(...args));
  client.on('error', console.error);

  await client.login(env.discordToken);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Errore in avvio bot:', error);
  process.exit(1);
});

