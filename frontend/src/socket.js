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

const socket = new SocketManager('ws://localhost:3001');
export default socket;
