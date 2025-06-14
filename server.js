const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { addUser, removeUser, getUser } = require('./users');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    switch (data.type) {
      case 'LOGIN':
        addUser(data.username, ws);
        break;
      case 'MESSAGE':
        const recipient = getUser(data.to);
        if (recipient) {
          recipient.send(JSON.stringify({
            type: 'MESSAGE',
            from: data.from,
            content: data.content,
          }));
        }
        break;
    }
  });

  ws.on('close', () => {
    removeUser(ws);
  });
});

server.listen(3001, () => {
  console.log('WebSocket server running on port 3001');
});
