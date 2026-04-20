import React, { useState, useEffect } from 'react';
import socket from './socket';
import './Login.css';

const PRESET_ROOMS = ['general', 'dev-talk', 'design', 'gaming', 'random'];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('general');
  const [customRoom, setCustomRoom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const off1 = socket.on('_connected', () => setConnected(true));
    const off2 = socket.on('_disconnected', () => setConnected(false));
    return () => { off1(); off2(); };
  }, []);

  const activeRoom = useCustom ? customRoom.trim() : room;

  const handleJoin = () => {
    const name = username.trim();
    if (!name) return setError('Please enter a username.');
    if (!activeRoom) return setError('Please enter a room name.');
    if (name.length < 2) return setError('Username must be at least 2 characters.');

    setError('');
    setLoading(true);
    socket.send({ type: 'LOGIN', username: name });
    socket.send({ type: 'JOIN', username: name, room: activeRoom });

    setTimeout(() => onLogin({ username: name, room: activeRoom }), 700);
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleJoin(); };

  return (
    <div className="login-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />

      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="brand-name">KRCC</span>
          <span className={`conn-pill ${connected ? 'on' : 'off'}`}>
            <span className="conn-dot" />
            {connected ? 'live' : 'connecting'}
          </span>
        </div>

        <h1 className="login-heading">
          Start<br />chatting
        </h1>
        <p className="login-sub">No signup. Pick a name, pick a room.</p>

        <div className="login-fields">
          <div className="field-group">
            <label className="field-label">Your name</label>
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Shivam"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              onKeyDown={handleKey}
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="field-group">
            <label className="field-label">Room</label>
            <div className="room-chips">
              {PRESET_ROOMS.map(r => (
                <button
                  key={r}
                  className={`room-chip ${!useCustom && room === r ? 'active' : ''}`}
                  onClick={() => { setRoom(r); setUseCustom(false); setError(''); }}
                >
                  #{r}
                </button>
              ))}
              <button
                className={`room-chip custom-chip ${useCustom ? 'active' : ''}`}
                onClick={() => { setUseCustom(true); setError(''); }}
              >
                + custom
              </button>
            </div>
            {useCustom && (
              <input
                className="field-input mt-8"
                type="text"
                placeholder="room name..."
                value={customRoom}
                onChange={e => { setCustomRoom(e.target.value); setError(''); }}
                onKeyDown={handleKey}
                maxLength={30}
                autoFocus
              />
            )}
          </div>

          {error && <p className="field-error">{error}</p>}

          <button
            className={`join-btn ${loading ? 'loading' : ''} ${!username.trim() ? 'disabled' : ''}`}
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loader" />
            ) : (
              <>
                <span>Join Room</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>

        <p className="login-note">
          Joining <strong>#{activeRoom || '...'}</strong> as <strong>{username || '...'}</strong>
        </p>
      </div>
    </div>
  );
}
