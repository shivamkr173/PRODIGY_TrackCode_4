import React, { useState } from 'react';
import Login from './Login';
import ChatRoom from './ChatRoom';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null); // { username, room }

  if (!user) return <Login onLogin={setUser} />;
  return (
    <ChatRoom
      username={user.username}
      room={user.room}
      onLeave={() => setUser(null)}
    />
  );
}
