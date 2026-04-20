import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from './socket';
import './Chat.css';

// ─────────────────────────────────────────────
// Emoji Data
// ─────────────────────────────────────────────
const EMOJI_CATS = {
  '😀': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😋','😛','😜','🤪','😎','🤓','🧐','🥳','😤','😠','😡','🤬','😈','💀','💩','🤡','👻','👾','🤖','😺','😸'],
  '👋': ['👋','🤚','✋','🖖','👌','✌️','🤞','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤝','🙏','💪','🦾','👀','💋','👶','🧒','👦','👧','🧑','👱','👨','👩','🧓','👴','👵','🧑‍💻','👨‍💻','👩‍💻'],
  '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐴','🦄','🐝','🦋','🐌','🐞','🌸','🌺','🌻','🌹','🌷','🍀','☘️','🌿','🍃','🔥','⚡','🌈','❄️','⭐','🌟','☀️','🌙','🌊'],
  '🍕': ['🍕','🍔','🍟','🌭','🌮','🌯','🥙','🥚','🍳','🥞','🧇','🥓','🍗','🍖','🧀','🥑','🍆','🥦','🥕','🌽','🍎','🍊','🍋','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🍦','🍧','🍩','🍪','🎂','🍰','🧁','🍫','🍬','🍭','☕','🧃','🥤','🧋','🍺','🍷','🥂'],
  '⚽': ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','⛳','🎣','🤿','🎽','🛹','🎮','🕹','🎯','🎳','🎲','🧩','♟','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎸','🎺','🎻','🎵','🎶','🏆','🥇','🥈','🥉'],
  '🚗': ['🚗','🚕','🚙','🚌','🏎','🚓','🚑','🚒','🛻','🚚','🚛','🚜','🏍','🛵','🚲','🛴','🚁','🛸','🚀','✈️','🛩','💺','🚂','🚆','🚇','🛶','⛵','🚤','🛳','🚢','⚓','🗺','🏔','⛰','🌋','🏕','🏖','🏜','🏝','🏠','🏡','🏢','🏥','🏦','🏨','🏰','🗼','🗽'],
  '💡': ['⌚','📱','💻','⌨️','🖥','🖨','🖱','💾','💿','📀','🎥','📷','📸','📹','🔍','🔎','💡','🔦','📔','📕','📖','📚','📊','📈','📉','🔒','🔓','🔑','🔨','⚒','🛠','🔧','🔩','⚙️','💊','💉','🩺','🩹','🧴','🧹','🧺','🧻','🧼','🎁','🎀','🎊','🎉','🎈','🔔','📢','📣','💰','💳','💎'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','✡️','☯️','🔱','⚜️','🔰','♻️','✅','❌','⭕','🛑','⛔','📛','🚫','💯','💢','⚠️','❗','❕','❓','❔','‼️','⁉️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','➕','➖','✖️'],
};
const CAT_KEYS = Object.keys(EMOJI_CATS);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const COLORS = ['#00d4ff','#ff6b6b','#ffd93d','#6bcb77','#c77dff','#ff9f43','#48dbfb','#ff6b81','#a8edea'];
function getColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}
function fmtSize(b) { return b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); }
function fmtDuration(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

// ─────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────
function Avatar({ name = '?', size = 36 }) {
  const c = getColor(name);
  return (
    <div className="avatar" style={{ width:size, height:size, background:c+'22', border:`2px solid ${c}`, color:c, fontSize:size*0.38 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────
// Emoji Picker
// ─────────────────────────────────────────────
function EmojiPicker({ onPick }) {
  const [cat, setCat] = useState(CAT_KEYS[0]);
  const [search, setSearch] = useState('');
  const emojis = search
    ? CAT_KEYS.flatMap(k => EMOJI_CATS[k]).filter(e => e.includes(search))
    : EMOJI_CATS[cat];
  return (
    <div className="emoji-picker">
      <div className="emoji-search-wrap">
        <input className="emoji-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
      </div>
      <div className="emoji-cats">
        {CAT_KEYS.map(k => (
          <button key={k} className={`emoji-cat-btn ${cat===k&&!search?'active':''}`} onClick={() => { setCat(k); setSearch(''); }}>{k}</button>
        ))}
      </div>
      <div className="emoji-grid">
        {emojis.map((e,i) => <button key={i} className="emoji-btn" onClick={() => onPick(e)}>{e}</button>)}
        {emojis.length === 0 && <span className="emoji-empty">No results</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WebRTC Hook
// ─────────────────────────────────────────────
const STUN = { iceServers: [{ urls:'stun:stun.l.google.com:19302' }] };

function useWebRTC(username, room) {
  const pc = useRef(null);
  const localStream = useRef(null);
  const pendingOffer = useRef(null);
  const timerRef = useRef(null);
  const [callState, setCallState] = useState({ status:'idle' });
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    setCallTimer(0);
    if (localStream.current) { localStream.current.getTracks().forEach(t => t.stop()); localStream.current = null; }
    if (pc.current) { pc.current.close(); pc.current = null; }
    setLocalVideoStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCamOff(false);
    setCallState({ status:'idle' });
    pendingOffer.current = null;
  }, []);

  const createPC = useCallback((target) => {
    const conn = new RTCPeerConnection(STUN);
    conn.onicecandidate = (e) => { if (e.candidate) socket.send({ type:'ICE_CANDIDATE', target, candidate:e.candidate, room }); };
    conn.ontrack = (e) => setRemoteStream(e.streams[0]);
    conn.onconnectionstatechange = () => { if (['failed','disconnected','closed'].includes(conn.connectionState)) cleanup(); };
    pc.current = conn;
    return conn;
  }, [cleanup, room]);

  const startCall = useCallback(async (target, callType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:callType==='video' });
      localStream.current = stream;
      setLocalVideoStream(stream);
      const conn = createPC(target);
      stream.getTracks().forEach(t => conn.addTrack(t, stream));
      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);
      socket.send({ type:'CALL_OFFER', target, offer, callType, room });
      setCallState({ status:'calling', type:callType, target });
    } catch (err) { alert('Mic/camera error: '+err.message); cleanup(); }
  }, [createPC, cleanup, room]);

  const acceptCall = useCallback(async () => {
    const { from, offer, callType } = pendingOffer.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:callType==='video' });
      localStream.current = stream;
      setLocalVideoStream(stream);
      const conn = createPC(from);
      stream.getTracks().forEach(t => conn.addTrack(t, stream));
      await conn.setRemoteDescription(offer);
      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);
      socket.send({ type:'CALL_ANSWER', target:from, answer, room });
      setCallState({ status:'active', type:callType, target:from });
      timerRef.current = setInterval(() => setCallTimer(t => t+1), 1000);
    } catch (err) { alert('Mic/camera error: '+err.message); rejectCall(); }
  }, [createPC, room]);

  const rejectCall = useCallback(() => {
    if (pendingOffer.current) socket.send({ type:'CALL_REJECT', target:pendingOffer.current.from, room });
    cleanup();
  }, [cleanup, room]);

  const endCall = useCallback(() => {
    if (callState.target) socket.send({ type:'CALL_END', target:callState.target, room });
    cleanup();
  }, [callState.target, cleanup, room]);

  const toggleMute = () => {
    if (!localStream.current) return;
    localStream.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  };
  const toggleCam = () => {
    if (!localStream.current) return;
    localStream.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(c => !c);
  };

  useEffect(() => {
    const offs = [
      socket.on('CALL_OFFER', (data) => {
        pendingOffer.current = { from:data.from, offer:data.offer, callType:data.callType };
        setCallState({ status:'incoming', type:data.callType, from:data.from });
      }),
      socket.on('CALL_ANSWER', async (data) => {
        if (pc.current) {
          await pc.current.setRemoteDescription(data.answer);
          setCallState(prev => ({ ...prev, status:'active' }));
          timerRef.current = setInterval(() => setCallTimer(t => t+1), 1000);
        }
      }),
      socket.on('ICE_CANDIDATE', async (data) => {
        if (pc.current && data.candidate) try { await pc.current.addIceCandidate(data.candidate); } catch {}
      }),
      socket.on('CALL_REJECT', () => { alert('Call declined.'); cleanup(); }),
      socket.on('CALL_END', () => cleanup()),
    ];
    return () => offs.forEach(o => o());
  }, [cleanup]);

  return { callState, localVideoStream, remoteStream, isMuted, isCamOff, callTimer, startCall, acceptCall, rejectCall, endCall, toggleMute, toggleCam };
}

// ─────────────────────────────────────────────
// Call Modal
// ─────────────────────────────────────────────
function CallModal({ callState, localVideoStream, remoteStream, isMuted, isCamOff, callTimer, onAccept, onReject, onEnd, onToggleMute, onToggleCam }) {
  const localRef  = useRef(null);
  const remoteRef = useRef(null);
  useEffect(() => { if (localRef.current  && localVideoStream) localRef.current.srcObject  = localVideoStream; }, [localVideoStream]);
  useEffect(() => { if (remoteRef.current && remoteStream)     remoteRef.current.srcObject = remoteStream; },     [remoteStream]);

  if (callState.status === 'idle') return null;
  const isVideo  = callState.type === 'video';
  const isActive = callState.status === 'active';

  return (
    <div className="call-modal">
      <div className={`call-inner ${isVideo && isActive ? 'video-mode' : ''}`}>
        {isVideo && isActive && (
          <div className="video-stage">
            <video ref={remoteRef} autoPlay playsInline className="video-remote" />
            <video ref={localRef}  autoPlay playsInline muted className="video-local" />
          </div>
        )}
        {(!isVideo || !isActive) && (
          <div className="call-info">
            <div className="call-avatar-ring">
              <Avatar name={callState.target || callState.from} size={72} />
              {callState.status !== 'active' && (
                <><div className="ring r1" /><div className="ring r2" /><div className="ring r3" /></>
              )}
            </div>
            <p className="call-name">{callState.target || callState.from}</p>
            <p className="call-status">
              {callState.status === 'calling' && `Calling… ${isVideo ? '📹' : '📞'}`}
              {callState.status === 'incoming' && `Incoming ${isVideo ? 'video' : 'voice'} call`}
              {callState.status === 'active'   && <span className="call-timer-text">{fmtDuration(callTimer)}</span>}
            </p>
          </div>
        )}
        {isVideo && isActive && (
          <div className="call-overlay-info">
            <span className="call-timer-badge">{fmtDuration(callTimer)}</span>
          </div>
        )}
        <div className="call-controls">
          {callState.status === 'incoming' ? (
            <>
              <button className="call-ctrl reject" onClick={onReject} title="Decline">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c1.12.45 2.3.78 3.53.98a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2 5.18 2 2 0 0 1 4 3h3a2 2 0 0 1 2 1.72"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
              </button>
              <button className="call-ctrl accept" onClick={onAccept} title="Accept">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.38 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
            </>
          ) : (
            <>
              <button className={`call-ctrl mute-btn ${isMuted?'active':''}`} onClick={onToggleMute} title={isMuted?'Unmute':'Mute'}>
                {isMuted
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                }
              </button>
              {isVideo && (
                <button className={`call-ctrl cam-btn ${isCamOff?'active':''}`} onClick={onToggleCam} title={isCamOff?'Cam on':'Cam off'}>
                  {isCamOff
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  }
                </button>
              )}
              <button className="call-ctrl end" onClick={onEnd} title="End call">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c1.12.45 2.3.78 3.53.98a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2 5.18 2 2 0 0 1 4 3h3a2 2 0 0 1 2 1.72"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Message
// ─────────────────────────────────────────────
function Message({ msg, isOwn, showAvatar }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [dur, setDur]         = useState(0);
  const [prog, setProg]       = useState(0);

  if (msg.system) return <div className="sys-msg">{msg.text}</div>;

  const isImage = msg.fileType?.startsWith('image/');
  const isAudio = msg.isVoice || msg.fileType?.startsWith('audio/');

  return (
    <div className={`msg-row ${isOwn?'own':'other'}`}>
      {!isOwn && showAvatar ? <Avatar name={msg.sender} /> : !isOwn && <div style={{width:36}} />}
      <div className="msg-bubble-wrap">
        {!isOwn && showAvatar && <span className="msg-sender" style={{color:getColor(msg.sender)}}>{msg.sender}</span>}
        <div className={`msg-bubble ${isOwn?'bubble-own':'bubble-other'}`}>
          {isAudio && msg.file && (
            <div className="voice-msg">
              <button className="voice-play" onClick={() => { if(!audioRef.current)return; if(playing){audioRef.current.pause();setPlaying(false);}else{audioRef.current.play();setPlaying(true);} }}>
                {playing
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                }
              </button>
              <div className="voice-waveform">
                {Array.from({length:26},(_,i) => <div key={i} className="voice-bar" style={{height:4+Math.abs(Math.sin(i*0.9))*10+'px', opacity:prog>(i/26)?1:0.3}} />)}
              </div>
              <span className="voice-dur">{fmtDuration(dur)}</span>
              <audio ref={audioRef} src={msg.file}
                onEnded={()=>{setPlaying(false);setProg(0);}}
                onTimeUpdate={()=>{ if(audioRef.current){setDur(Math.round(audioRef.current.duration)||0);setProg(audioRef.current.currentTime/(audioRef.current.duration||1));}}}
                onLoadedMetadata={()=>{ if(audioRef.current) setDur(Math.round(audioRef.current.duration)||0);}}
              />
            </div>
          )}
          {isImage && msg.file && (
            <img className="msg-image" src={msg.file} alt={msg.fileName||'image'} onClick={()=>window.open(msg.file,'_blank')} />
          )}
          {msg.file && !isImage && !isAudio && (
            <a className="msg-file" href={msg.file} download={msg.fileName} target="_blank" rel="noreferrer">
              <div className="msg-file-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="msg-file-info">
                <span className="msg-file-name">{msg.fileName}</span>
                {msg.fileSize && <span className="msg-file-size">{fmtSize(msg.fileSize)}</span>}
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
          )}
          {msg.text && <span className="msg-text">{msg.text}</span>}
          <span className="msg-time">{fmtTime(msg.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ChatRoom
// ─────────────────────────────────────────────
export default function ChatRoom({ username, room, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers]       = useState([]);
  const [input, setInput]       = useState('');
  const [typers, setTypers]     = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEmoji, setShowEmoji]     = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const bottomRef     = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef  = useRef(null);
  const mediaRec      = useRef(null);
  const recChunks     = useRef([]);
  const inputRef      = useRef(null);
  const emojiRef      = useRef(null);

  const { callState, localVideoStream, remoteStream, isMuted, isCamOff, callTimer,
          startCall, acceptCall, rejectCall, endCall, toggleMute, toggleCam }
    = useWebRTC(username, room);

  useEffect(() => {
    const offs = [
      socket.on('MESSAGE', d => setMessages(p => [...p, d])),
      socket.on('USERS',   d => setUsers(d.users || [])),
      socket.on('TYPING',  d => setTypers(p => d.isTyping ? (p.includes(d.username)?p:[...p,d.username]) : p.filter(u=>u!==d.username))),
    ];
    return () => offs.forEach(o => o());
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, typers]);

  useEffect(() => {
    const h = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const sendMessage = (text = input.trim()) => {
    if (!text) return;
    setMessages(p => [...p, { sender:username, text, timestamp:Date.now(), id:`own-${Date.now()}` }]);
    socket.send({ type:'MESSAGE', text, room });
    setInput('');
    setShowEmoji(false);
    socket.send({ type:'TYPING', isTyping:false });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.send({ type:'TYPING', isTyping:true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.send({ type:'TYPING', isTyping:false }), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const msg = { sender:username, text:'', timestamp:Date.now(), id:`own-${Date.now()}`, file:reader.result, fileName:file.name, fileType:file.type, fileSize:file.size };
      setMessages(p => [...p, msg]);
      socket.send({ type:'MESSAGE', file:reader.result, fileName:file.name, fileType:file.type, fileSize:file.size, room });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      recChunks.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size>0) recChunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recChunks.current, { type:'audio/webm' });
        stream.getTracks().forEach(t=>t.stop());
        const reader = new FileReader();
        reader.onload = () => {
          const msg = { sender:username, text:'', timestamp:Date.now(), id:`own-${Date.now()}`, file:reader.result, fileName:'voice.webm', fileType:'audio/webm', isVoice:true };
          setMessages(p => [...p, msg]);
          socket.send({ type:'MESSAGE', file:reader.result, fileName:'voice.webm', fileType:'audio/webm', isVoice:true, room });
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      mediaRec.current = mr;
      setIsRecording(true);
    } catch { alert('Microphone access denied.'); }
  };

  const stopRecording = () => {
    if (mediaRec.current?.state !== 'inactive') mediaRec.current?.stop();
    setIsRecording(false);
  };

  const otherUsers = users.filter(u => u !== username);
  const handleVoiceCall = () => { if (!otherUsers.length) return alert('No one else in the room!'); startCall(otherUsers[0], 'audio'); };
  const handleVideoCall = () => { if (!otherUsers.length) return alert('No one else in the room!'); startCall(otherUsers[0], 'video'); };
  const handleLeave = () => { socket.send({ type:'LEAVE', room }); onLeave(); };
  const typingOthers = typers.filter(t => t !== username);

  return (
    <div className="chatroom">
      <CallModal callState={callState} localVideoStream={localVideoStream} remoteStream={remoteStream}
        isMuted={isMuted} isCamOff={isCamOff} callTimer={callTimer}
        onAccept={acceptCall} onReject={rejectCall} onEnd={endCall} onToggleMute={toggleMute} onToggleCam={toggleCam} />

      <header className="chat-header">
        <div className="chat-header-left">
          <button className="icon-btn" onClick={() => setSidebarOpen(v=>!v)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="room-info">
            <span className="room-hash">#</span>
            <span className="room-name">{room}</span>
          </div>
        </div>
        <div className="chat-header-right">
          <span className="online-badge"><span className="online-dot" />{users.length} online</span>
          <button className="hdr-call-btn voice" onClick={handleVoiceCall} title="Voice call">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 1 5.18 2 2 0 0 1 3 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.96a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <button className="hdr-call-btn video" onClick={handleVideoCall} title="Video call">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </button>
          <button className="leave-btn" onClick={handleLeave}>Leave</button>
        </div>
      </header>

      <div className="chat-body">
        <aside className={`chat-sidebar ${sidebarOpen?'open':'closed'}`}>
          <div className="sidebar-title">Members · {users.length}</div>
          <div className="user-list">
            {users.map((u,i) => (
              <div key={i} className="user-item">
                <Avatar name={u} size={30} />
                <span className="user-name" style={{color:getColor(u)}}>
                  {u}{u===username && <span className="you-badge"> you</span>}
                </span>
                <span className="user-sdot" />
              </div>
            ))}
          </div>
        </aside>

        <main className="chat-messages">
          <div className="messages-inner">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <p>No messages yet — say hello!</p>
              </div>
            )}
            {messages.map((msg,i) => {
              const isOwn = msg.sender === username;
              const showAvatar = !isOwn && (i===0 || messages[i-1]?.sender !== msg.sender);
              return <Message key={msg.id||i} msg={msg} isOwn={isOwn} showAvatar={showAvatar} />;
            })}
            {typingOthers.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-dots"><span/><span/><span/></div>
                <span className="typing-label">{typingOthers.length===1?`${typingOthers[0]} is typing`:`${typingOthers.join(', ')} are typing`}…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </main>
      </div>

      <footer className="chat-footer">
        {showEmoji && (
          <div ref={emojiRef} className="emoji-picker-wrap">
            <EmojiPicker onPick={(e)=>{setInput(p=>p+e);inputRef.current?.focus();}} />
          </div>
        )}
        {isRecording && (
          <div className="recording-bar">
            <span className="rec-dot"/><span>Recording…</span>
            <button className="rec-send" onClick={stopRecording}>✓ Send</button>
          </div>
        )}
        <div className="input-row">
          <div className="input-tools-left">
            <button className={`tool-btn ${showEmoji?'active':''}`} onClick={()=>setShowEmoji(v=>!v)} title="Emoji">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            <button className="tool-btn" onClick={()=>fileInputRef.current?.click()} title="Attach file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              <input ref={fileInputRef} type="file" accept="*/*" style={{display:'none'}} onChange={handleFileChange}/>
            </button>
            <button
              className={`tool-btn mic-btn ${isRecording?'recording':''}`}
              onMouseDown={startRecording} onMouseUp={stopRecording}
              onTouchStart={startRecording} onTouchEnd={stopRecording}
              title="Hold to record voice message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          </div>
          <div className="input-wrap">
            <textarea ref={inputRef} className="chat-input" placeholder={`Message #${room}`}
              value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} rows={1} />
          </div>
          <button className={`send-btn ${input.trim()?'active':''}`} onClick={()=>sendMessage()} disabled={!input.trim()}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
