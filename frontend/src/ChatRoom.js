import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";

const COLORS = [
  "#00d4ff", "#ff6b6b", "#ffd93d", "#6bcb77",
  "#c77dff", "#ff9f43", "#48dbfb", "#ff6b81",
];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function Avatar({ name, size = 36 }) {
  const color = getColor(name);
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: color + "22", border: `2px solid ${color}`, color }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

function Message({ msg, isOwn, showAvatar }) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`msg-row ${isOwn ? "own" : "other"}`}>
      {!isOwn && showAvatar && <Avatar name={msg.sender} />}
      {!isOwn && !showAvatar && <div style={{ width: 36 }} />}
      <div className="msg-bubble-wrap">
        {!isOwn && showAvatar && (
          <span className="msg-sender" style={{ color: getColor(msg.sender) }}>
            {msg.sender}
          </span>
        )}
        <div className={`msg-bubble ${isOwn ? "bubble-own" : "bubble-other"}`}>
          <span className="msg-text">{msg.text}</span>
          <span className="msg-time">{time}</span>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ typers }) {
  if (!typers.length) return null;
  const label = typers.length === 1 ? `${typers[0]} is typing` : `${typers.join(", ")} are typing`;
  return (
    <div className="typing-indicator">
      <span className="typing-dots">
        <span /><span /><span />
      </span>
      <span className="typing-label">{label}…</span>
    </div>
  );
}

export default function ChatRoom({ socket, username, room, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState("");
  const [typers, setTypers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("roomUsers", ({ users }) => setUsers(users));
    socket.on("typing", ({ username: u, isTyping }) => {
      setTypers((prev) =>
        isTyping ? (prev.includes(u) ? prev : [...prev, u]) : prev.filter((x) => x !== u)
      );
    });

    return () => {
      socket.off("message");
      socket.off("roomUsers");
      socket.off("typing");
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typers]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !socket) return;
    socket.emit("chatMessage", text);
    setInput("");
    socket.emit("typing", { isTyping: false });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing", { isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { isTyping: false });
    }, 2000);
  };

  const onlineCount = users.length;

  return (
    <div className="chatroom">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="icon-btn" onClick={() => setSidebarOpen((v) => !v)} title="Toggle members">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="room-info">
            <span className="room-hash">#</span>
            <span className="room-name">{room}</span>
          </div>
        </div>
        <div className="chat-header-right">
          <span className="online-badge">
            <span className="online-dot" />
            {onlineCount} online
          </span>
          <button className="leave-btn" onClick={onLeave}>Leave</button>
        </div>
      </header>

      <div className="chat-body">
        {/* Sidebar */}
        <aside className={`chat-sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-title">Members</div>
          <div className="user-list">
            {users.map((u) => (
              <div key={u.id} className="user-item">
                <Avatar name={u.username} size={30} />
                <span className="user-name" style={{ color: getColor(u.username) }}>
                  {u.username}
                  {u.username === username && <span className="you-badge"> you</span>}
                </span>
                <span className="user-status-dot" />
              </div>
            ))}
          </div>
        </aside>

        {/* Messages */}
        <main className="chat-messages">
          <div className="messages-inner">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p>No messages yet. Say hello!</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isOwn = msg.sender === username;
              const prevSender = i > 0 ? messages[i - 1].sender : null;
              const showAvatar = !isOwn && msg.sender !== prevSender;
              return (
                <Message key={msg.id || i} msg={msg} isOwn={isOwn} showAvatar={showAvatar} />
              );
            })}
            <TypingIndicator typers={typers.filter((t) => t !== username)} />
            <div ref={bottomRef} />
          </div>
        </main>
      </div>

      {/* Input */}
      <footer className="chat-footer">
        <div className="input-wrap">
          <textarea
            className="chat-input"
            placeholder={`Message #${room}`}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`send-btn ${input.trim() ? "active" : ""}`}
            onClick={sendMessage}
            disabled={!input.trim()}
            title="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
