const http = require('http');

function startHealthServer() {
  const port = Number(process.env.PORT || 0);

  if (!port) {
    return null;
  }

  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot service running');
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Health server in ascolto su porta ${port}`);
  });

  return server;
}

module.exports = {
  startHealthServer
};

