import { io, Socket } from 'socket.io-client';

type SocketHandler = (...args: any[]) => void;

interface Subscription {
  events: Array<{ event: string; handler: SocketHandler }>;
  setup: (s: Socket) => void;
}

// ── Persist across Vite HMR ──────────────────────────────────
// Vite HMR re-evaluates this module on every hot update, which resets
// module-level variables. Store on `window` to survive HMR.
const SOCKET_KEY = '__helpdesk_socket__';
const SUBS_KEY   = '__helpdesk_subs__';

function getSocket_(): Socket | null {
  return (window as any)[SOCKET_KEY] ?? null;
}
function setSocket_(s: Socket | null) {
  (window as any)[SOCKET_KEY] = s;
}
function getSubs(): Set<Subscription> {
  if (!(window as any)[SUBS_KEY]) {
    (window as any)[SUBS_KEY] = new Set<Subscription>();
  }
  return (window as any)[SUBS_KEY];
}

export function connectSocket(token: string) {
  const existing = getSocket_();
  if (existing?.connected) return existing;

  // Clean up dead socket
  if (existing) {
    existing.removeAllListeners();
    existing.disconnect();
  }

  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

  const socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  setSocket_(socket);

  socket.on('connect', () => {
    console.log('[Socket] Connected, id:', socket.id);
    reattachAll();
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected, reason:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  const socket = getSocket_();
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    setSocket_(null);
  }
}

export function getSocket(): Socket | null {
  return getSocket_();
}

/** Re-register all subscriptions on (re)connect. */
function reattachAll() {
  const socket = getSocket_();
  if (!socket) return;

  const subs = getSubs();
  subs.forEach((sub) => {
    sub.events.forEach(({ event, handler }) => socket.off(event, handler));
    sub.events.length = 0;
    sub.setup(socket);
  });
}

/**
 * Subscribe to socket events.
 *
 * The callback receives `(socket, on)` where `on(event, handler)` is a
 * tracked version of `socket.on()`. When the returned unsubscribe function
 * is called, all event listeners registered via `on` are automatically
 * removed, preventing listener leaks.
 *
 * Listeners are automatically re-registered on socket reconnect.
 * Use `socket` directly only for `.emit()` calls.
 */
export function subscribeSocket(
  callback: (s: Socket, on: (event: string, handler: SocketHandler) => void) => void,
): () => void {
  const subs = getSubs();

  const sub: Subscription = {
    events: [],
    setup(s: Socket) {
      const on = (event: string, handler: SocketHandler) => {
        sub.events.push({ event, handler });
        s.on(event, handler);
      };
      callback(s, on);
    },
  };

  subs.add(sub);

  // If already connected, fire immediately
  const socket = getSocket_();
  if (socket?.connected) {
    sub.setup(socket);
  }

  return () => {
    const s = getSocket_();
    sub.events.forEach(({ event, handler }) => s?.off(event, handler));
    sub.events.length = 0;
    subs.delete(sub);
  };
}
