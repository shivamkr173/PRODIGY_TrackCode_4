import React, { useState } from "react";

function Login({ socket, setUsername, setRoom, setShowChat }) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  const joinRoom = () => {
    if (name !== "" && roomId !== "") {
      setUsername(name);
      setRoom(roomId);

      socket.emit("join_room", roomId);

      setShowChat(true);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Join Chat Room</h2>

      <input
        type="text"
        placeholder="Enter username"
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Enter room ID"
        onChange={(e) => setRoomId(e.target.value)}
      />

      <br /><br />

      <button onClick={joinRoom}>Join Chat</button>
    </div>
  );
}

export default Login;
