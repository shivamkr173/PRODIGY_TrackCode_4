import React, { useState, useEffect } from "react";
import "./Chat.css";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date().toLocaleTimeString(),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });
  }, [socket]);

  return (
    <div className="chat-window">

      <div className="chat-header">
        <p>Room: {room}</p>
      </div>

      <div className="chat-body">
        {messageList.map((messageContent, index) => {
          return (
            <div
              key={index}
              className="message"
              id={username === messageContent.author ? "you" : "other"}
            >
              <div className="message-content">
                <p>{messageContent.message}</p>
              </div>

              <div className="message-meta">
                <span>{messageContent.author}</span>
                <span>{messageContent.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Type message..."
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage}>➤</button>
      </div>

    </div>
  );
}

export default Chat;
