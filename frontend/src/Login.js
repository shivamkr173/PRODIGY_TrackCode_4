import React, { useState } from 'react';
import socket from './socket';

function Login({ setUser }) {
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    socket.send(JSON.stringify({ type: 'LOGIN', username }));
    setUser(username);
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
