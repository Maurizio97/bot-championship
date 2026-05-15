const express = require('express');

function startHealthServer() {
  const port = Number(process.env.PORT || 3000);
  const app = express();

  app.get('/', (_req, res) => {
    res.status(200).type('text/plain').send('OK');
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Health server in ascolto su porta ${port}`);
  });
}

module.exports = {
  startHealthServer
};

