import React, { useEffect, useState } from 'react';
import socket from './socket';

function ChatRoom({ user }) {
  const [message, setMessage] = useState('');
  const [toUser, setToUser] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'MESSAGE') {
        setMessages((prev) => [...prev, `${data.from}: ${data.content}`]);
      }
    };
  }, []);

  const sendMessage = () => {
    socket.send(JSON.stringify({
      type: 'MESSAGE',
      from: user,
      to: toUser,
      content: message,
    }));
    setMessages((prev) => [...prev, `Me: ${message}`]);
    setMessage('');
  };

  return (
    <div>
      <h2>Welcome, {user}</h2>
      <input
        type="text"
        placeholder="To User"
        onChange={(e) => setToUser(e.target.value)}
      />
      <div>
        {messages.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
      <input
        type="text"
        placeholder="Your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatRoom;
