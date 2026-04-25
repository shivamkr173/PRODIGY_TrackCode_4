const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// rooms: Map<roomName, Set<{ws, username}>>
const rooms = new Map();
// clients: Map<ws, {username, room}>
const clients = new Map();

function getRoomUsers(room) {
  return [...(rooms.get(room) || [])].map(u => u.username);
}

function broadcastToRoom(room, data, excludeWs = null) {
  const roomSet = rooms.get(room);
  if (!roomSet) return;
  const msg = JSON.stringify(data);
  roomSet.forEach(({ ws }) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function sendToUser(room, targetUsername, data) {
  const roomSet = rooms.get(room);
  if (!roomSet) return;
  const target = [...roomSet].find(u => u.username === targetUsername);
  if (target && target.ws.readyState === WebSocket.OPEN) {
    target.ws.send(JSON.stringify(data));
  }
}

function broadcastUserList(room) {
  const users = getRoomUsers(room);
  broadcastToRoom(room, { type: 'USERS', users });
}

function leaveRoom(ws) {
  const client = clients.get(ws);
  if (!client || !client.room) return;
  const { username, room } = client;
  const roomSet = rooms.get(room);
  if (!roomSet) return;

  roomSet.forEach(u => { if (u.ws === ws) roomSet.delete(u); });

  if (roomSet.size === 0) {
    rooms.delete(room);
  } else {
    broadcastToRoom(room, {
      type: 'MESSAGE', sender: 'System', system: true,
      text: `${username} left the room`,
      timestamp: Date.now(), id: `sys-${Date.now()}`
    });
    broadcastUserList(room);
  }
  client.room = null;
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch { return; }

    const client = clients.get(ws) || {};

    switch (data.type) {

      case 'LOGIN': {
        clients.set(ws, { username: data.username, room: null });
        break;
      }

      case 'JOIN': {
        if (client.room) leaveRoom(ws);
        const { username, room } = data;
        clients.set(ws, { username, room });
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room).add({ ws, username });
        broadcastToRoom(room, {
          type: 'MESSAGE', sender: 'System', system: true,
          text: `${username} joined the room ✨`,
          timestamp: Date.now(), id: `sys-${Date.now()}`
        });
        broadcastUserList(room);
        break;
      }

      case 'MESSAGE': {
        if (!client.room) return;
        const msg = {
          type: 'MESSAGE',
          id: `${Date.now()}-${Math.random()}`,
          sender: client.username,
          text: data.text || '',
          file: data.file || null,
          fileName: data.fileName || null,
          fileType: data.fileType || null,
          fileSize: data.fileSize || null,
          isVoice: data.isVoice || false,
          timestamp: Date.now(),
        };
        // Exclude sender — they show it optimistically
        broadcastToRoom(client.room, msg, ws);
        break;
      }

      case 'TYPING': {
        if (!client.room) return;
        broadcastToRoom(client.room, {
          type: 'TYPING',
          username: client.username,
          isTyping: data.isTyping
        }, ws);
        break;
      }

      case 'LEAVE': {
        leaveRoom(ws);
        break;
      }

      // WebRTC Signaling — forward to specific target user
      case 'CALL_OFFER':
      case 'CALL_ANSWER':
      case 'ICE_CANDIDATE':
      case 'CALL_REJECT':
      case 'CALL_END': {
        if (!client.room) return;
        const payload = { ...data, from: client.username };
        if (data.target) {
          sendToUser(client.room, data.target, payload);
        } else {
          broadcastToRoom(client.room, payload, ws);
        }
        break;
      }
    }
  });

  ws.on('close', () => { leaveRoom(ws); clients.delete(ws); });
  ws.on('error', () => { leaveRoom(ws); clients.delete(ws); });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KRCC Chat Server running on port ${PORT}`);
});
