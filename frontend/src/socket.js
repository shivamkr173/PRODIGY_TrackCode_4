class SocketManager {
  constructor(url) {
    this.url = url;
    this.handlers = {};
    this.queue = [];
    this._connect();
  }

  _connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      // Flush any queued messages
      this.queue.forEach(msg => this.ws.send(msg));
      this.queue = [];
      this._trigger('_connected', {});
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this._trigger(data.type, data);
      } catch {}
    };

    this.ws.onclose = () => {
      this._trigger('_disconnected', {});
      // Auto-reconnect after 3 seconds
      setTimeout(() => this._connect(), 3000);
    };

    this.ws.onerror = () => this.ws.close();
  }

  _trigger(type, data) {
    (this.handlers[type] || []).forEach(h => h(data));
  }

  send(data) {
    const msg = JSON.stringify(data);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      // Queue it — will flush once connected
      this.queue.push(msg);
    }
  }

  on(type, handler) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(handler);
    // Returns unsubscribe function
    return () => this.off(type, handler);
  }

  off(type, handler) {
    if (this.handlers[type]) {
      this.handlers[type] = this.handlers[type].filter(h => h !== handler);
    }
  }
}

// ─────────────────────────────────────────────
// Change RENDER_URL to your actual Render service URL
// Get it from: Render dashboard → your service → the URL shown at the top
// Example: https://krcc-backend.onrender.com  →  wss://krcc-backend.onrender.com
// ─────────────────────────────────────────────
const RENDER_URL = 'wss://prodigy-trackcode-4.onrender.com';

const WS_URL = process.env.NODE_ENV === 'production'
  ? RENDER_URL
  : 'ws://localhost:3001';

const socket = new SocketManager(WS_URL);
export default socket;
