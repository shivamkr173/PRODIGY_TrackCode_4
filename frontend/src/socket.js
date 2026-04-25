class SocketManager {
  constructor(url) {
    this.url = url;
    this.handlers = {};
    this.queue = [];
    this._rejoinPayloads = []; // re-sent on every reconnect
    this._connected = false;
    this._connect();
  }

  _connect() {
    try { this.ws = new WebSocket(this.url); } catch(e) {
      setTimeout(() => this._connect(), 3000); return;
    }

    this.ws.onopen = () => {
      this._connected = true;
      // Re-send join/login payloads first (handles Render spin-down)
      this._rejoinPayloads.forEach(p => this.ws.send(JSON.stringify(p)));
      // Then flush queued messages
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
      this._connected = false;
      this._trigger('_disconnected', {});
      setTimeout(() => this._connect(), 3000);
    };

    this.ws.onerror = () => {
      this._connected = false;
      try { this.ws.close(); } catch {}
    };
  }

  _trigger(type, data) {
    (this.handlers[type] || []).forEach(h => h(data));
  }

  // Register payloads to auto-resend on every reconnect (LOGIN, JOIN)
  setRejoinPayloads(payloads) {
    this._rejoinPayloads = payloads;
  }

  clearRejoinPayloads() {
    this._rejoinPayloads = [];
  }

  send(data) {
    const msg = JSON.stringify(data);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.queue.push(msg);
    }
  }

  on(type, handler) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    if (this.handlers[type]) {
      this.handlers[type] = this.handlers[type].filter(h => h !== handler);
    }
  }
}

const RENDER_URL = 'wss://prodigy-trackcode-4.onrender.com';

const WS_URL = process.env.NODE_ENV === 'production'
  ? RENDER_URL
  : 'ws://localhost:3001';

const socket = new SocketManager(WS_URL);
export default socket;
