import { io, type Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'

class SocketClient {
  private socket: Socket | null = null

  connect(accessToken?: string): Socket {
    if (this.socket?.connected) return this.socket

    this.socket = io(`${WS_URL}/game`, {
      auth: { token: accessToken ?? '' },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.socket.on('connect_error', (err: Error) => {
      console.warn('[Socket] connection error:', err.message)
    })

    return this.socket
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  get instance(): Socket | null {
    return this.socket
  }

  emit(event: string, data: unknown) {
    this.socket?.emit(event, data)
  }

  on(event: string, handler: (...args: unknown[]) => void) {
    this.socket?.on(event, handler)
    return () => this.socket?.off(event, handler)
  }
}

export const socketClient = new SocketClient()
