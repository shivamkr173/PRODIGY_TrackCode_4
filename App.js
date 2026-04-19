import React, { useState } from "react";
import Login from "./Login";
import ChatRoom from "./ChatRoom";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      {!showChat ? (
        <Login
          socket={socket}
          setUsername={setUsername}
          setRoom={setRoom}
          setShowChat={setShowChat}
        />
      ) : (
        <ChatRoom socket={socket} username={username} room={room} />
      )}
    </div>
  );
}

export default App;
