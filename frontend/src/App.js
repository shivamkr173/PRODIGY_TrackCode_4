import React, { useState } from "react";
import ChatRoom from "./ChatRoom";
import io from "socket.io-client";

const socket = io("https://prodigy-trackcode-4.onrender.com");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  return (
    <div>
      {!showChat ? (
        <div>
          <h2>Join Chat</h2>

          <input
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Room ID"
            onChange={(e) => setRoom(e.target.value)}
          />

          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <ChatRoom socket={socket} username={username} room={room} />
      )}
    </div>
  );
}

export default App;
