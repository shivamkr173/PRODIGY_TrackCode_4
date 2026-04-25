import React, { useState } from 'react';
import socket from './socket';
import Login from './Login';
import ChatRoom from './ChatRoom';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null); // { username, room }

  const handleLogin = (userData) => {
    // Register LOGIN + JOIN as rejoin payloads
    // These will auto-resend if Render spins down and reconnects
    socket.setRejoinPayloads([
      { type: 'LOGIN', username: userData.username },
      { type: 'JOIN',  username: userData.username, room: userData.room },
    ]);
    socket.send({ type: 'LOGIN', username: userData.username });
    socket.send({ type: 'JOIN',  username: userData.username, room: userData.room });
    setUser(userData);
  };

  const handleLeave = () => {
    socket.clearRejoinPayloads();
    socket.send({ type: 'LEAVE' });
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;
  return (
    <ChatRoom
      username={user.username}
      room={user.room}
      onLeave={handleLeave}
    />
  );
}
