/**
 * socket.ts
 * Centralized Socket.io and API URL resolver for local development and production deployments.
 * Supports Vercel (frontend) connecting to Render (backend) via WebSockets.
 */

export const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL;
  }
  if (typeof window !== 'undefined') {
    // If running in browser locally on port 3000, backend is on port 4000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:4000`;
    }
    // In production without env var, default to the current host
    return window.location.origin;
  }
  return 'http://localhost:4000';
};

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL.replace(/\/+$/, '');
  }
  return '';
};
