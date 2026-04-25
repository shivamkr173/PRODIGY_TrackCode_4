const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  // Health check for Render — keeps server alive
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('KRCC Chat Server is running ✅');
});

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

// Send directly to one specific ws
function sendTo(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendToUser(room, targetUsername, data) {
  const roomSet = rooms.get(room);
  if (!roomSet) return;
  const target = [...roomSet].find(u => u.username === targetUsername);
  if (target) sendTo(target.ws, data);
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

  // Remove this ws from room
  for (const u of roomSet) {
    if (u.ws === ws) { roomSet.delete(u); break; }
  }

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
  console.log(`New connection. Total clients: ${clients.size + 1}`);

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch { return; }

    const client = clients.get(ws) || {};

    switch (data.type) {

      case 'LOGIN': {
        // If already logged in with same username, skip
        const existing = clients.get(ws);
        if (existing && existing.username === data.username) break;
        clients.set(ws, { username: data.username, room: existing?.room || null });
        console.log(`LOGIN: ${data.username}`);
        break;
      }

      case 'JOIN': {
        const { username, room } = data;

        // Leave current room if any
        if (client.room) leaveRoom(ws);

        // Update client record
        clients.set(ws, { username, room });

        // Add to room
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room).add({ ws, username });

        console.log(`JOIN: ${username} → #${room} (room size: ${rooms.get(room).size})`);

        // Tell everyone in room someone joined
        broadcastToRoom(room, {
          type: 'MESSAGE', sender: 'System', system: true,
          text: `${username} joined the room ✨`,
          timestamp: Date.now(), id: `sys-${Date.now()}`
        });

        // Send updated user list to EVERYONE in room (including new joiner)
        broadcastUserList(room);
        break;
      }

      case 'MESSAGE': {
        const c = clients.get(ws);
        if (!c || !c.room) return;
        const msg = {
          type: 'MESSAGE',
          id: `${Date.now()}-${Math.random()}`,
          sender: c.username,
          text: data.text || '',
          file: data.file || null,
          fileName: data.fileName || null,
          fileType: data.fileType || null,
          fileSize: data.fileSize || null,
          isVoice: data.isVoice || false,
          timestamp: Date.now(),
        };
        // Sender sees their own message optimistically — only send to others
        broadcastToRoom(c.room, msg, ws);
        break;
      }

      case 'TYPING': {
        const c = clients.get(ws);
        if (!c || !c.room) return;
        broadcastToRoom(c.room, {
          type: 'TYPING',
          username: c.username,
          isTyping: data.isTyping
        }, ws);
        break;
      }

      case 'LEAVE': {
        leaveRoom(ws);
        break;
      }

      // WebRTC Signaling
      case 'CALL_OFFER':
      case 'CALL_ANSWER':
      case 'ICE_CANDIDATE':
      case 'CALL_REJECT':
      case 'CALL_END': {
        const c = clients.get(ws);
        if (!c || !c.room) return;
        const payload = { ...data, from: c.username };
        if (data.target) {
          sendToUser(c.room, data.target, payload);
        } else {
          broadcastToRoom(c.room, payload, ws);
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    leaveRoom(ws);
    clients.delete(ws);
    console.log(`Connection closed. Remaining clients: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('WS error:', err.message);
    leaveRoom(ws);
    clients.delete(ws);
  });
});

// Keep Render from spinning down — ping every 14 minutes
const https = require('https');
const SELF_URL = process.env.RENDER_EXTERNAL_URL;
if (SELF_URL) {
  setInterval(() => {
    https.get(SELF_URL, (res) => {
      console.log(`Self-ping: ${res.statusCode}`);
    }).on('error', () => {});
  }, 14 * 60 * 1000);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KRCC Chat Server running on port ${PORT}`);
});
