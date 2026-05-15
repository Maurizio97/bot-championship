module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    // eslint-disable-next-line no-console
    console.log(`Bot online come ${client.user.tag}`);
  }
};

