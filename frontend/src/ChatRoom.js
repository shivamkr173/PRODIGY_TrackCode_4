import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import EmojiPicker from "emoji-picker-react";

function Chat({ socket, username, room }) {

  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef(null);

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

  const onEmojiClick = (emojiObject) => {
    setCurrentMessage((prev) => prev + emojiObject.emoji);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const messageData = {
        room: room,
        author: username,
        image: reader.result,
        time: new Date().toLocaleTimeString(),
      };

      socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("user_typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1500);
    });

  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  return (

    <div className="chat-window">

      <div className="chat-header">
        <p>Room : {room}</p>
      </div>

      <div className="chat-body">

        {messageList.map((msg, index) => {

          return (
            <div
              key={index}
              className="message"
              id={username === msg.author ? "you" : "other"}
            >

              {msg.image ? (
                <img src={msg.image} alt="" className="chat-image" />
              ) : (
                <div className="message-content">
                  <p>{msg.message}</p>
                </div>
              )}

              <div className="message-meta">
                <span>{msg.author}</span>
                <span>{msg.time}</span>
              </div>

            </div>
          );

        })}

        {typing && <p className="typing">Someone is typing...</p>}

        <div ref={messagesEndRef}></div>

      </div>

      <div className="chat-footer">

        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <input
          type="text"
          value={currentMessage}
          placeholder="Type message..."
          onChange={(e) => {
            setCurrentMessage(e.target.value);
            socket.emit("typing", room);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <label className="file-btn">
          📎
          <input type="file" hidden onChange={handleFile} />
        </label>

        <button onClick={sendMessage}>➤</button>

      </div>

      {showEmoji && (
        <div className="emoji-picker">
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

    </div>

  );
}

export default Chat;
