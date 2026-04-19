import React, { useState, useEffect } from "react";

function Chat({ socket, username, room }) {
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = async () => {
    if (message !== "") {
      const messageData = {
        room: room,
        author: username,
        message: message,
        time: new Date().toLocaleTimeString(),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });
  }, [socket]);

  return (
    <div>
      <h2>Room: {room}</h2>

      <div>
        {messageList.map((msg, index) => (
          <p key={index}>
            <strong>{msg.author}</strong>: {msg.message}
          </p>
        ))}
      </div>

      <input
        placeholder="Type message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
