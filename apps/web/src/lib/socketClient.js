import { io } from 'socket.io-client';
const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';
class SocketClient {
    constructor() {
        this.socket = null;
    }
    connect(accessToken) {
        if (this.socket?.connected)
            return this.socket;
        this.socket = io(`${WS_URL}/game`, {
            auth: { token: accessToken ?? '' },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
        this.socket.on('connect_error', (err) => {
            console.warn('[Socket] connection error:', err.message);
        });
        return this.socket;
    }
    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
    get instance() {
        return this.socket;
    }
    emit(event, data) {
        this.socket?.emit(event, data);
    }
    on(event, handler) {
        this.socket?.on(event, handler);
        return () => this.socket?.off(event, handler);
    }
}
export const socketClient = new SocketClient();
