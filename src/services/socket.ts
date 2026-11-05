/**
 * Socket.IO client for receiving realtime order progress updates.
 *
 * Connects to the /client namespace on the backend.
 * Authenticates with the JWT access token.
 *
 * Usage in components:
 *   import { useSocket } from '@/services/socket'
 *   const { subscribeOrder, unsubscribeOrder, onOrderProgress } = useSocket()
 */

import { io, Socket } from 'socket.io-client'
import { ref, onUnmounted, type Ref } from 'vue'
import { getAccessToken } from './api'

// Derive the WS URL from the API base URL
// VITE_API_BASE_URL is like "https://host/api/v1" -> WS connects to "https://host"
function getWSBaseUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  try {
    const url = new URL(apiBase, window.location.origin)
    return url.origin
  } catch {
    return window.location.origin
  }
}

let socket: Socket | null = null

/**
 * Get or create the singleton Socket.IO client connection.
 */
function getSocket(): Socket | null {
  const token = getAccessToken()
  if (!token) return null

  if (socket?.connected) return socket

  // If we already tried and failed or disconnected, try reconnecting
  if (socket && !socket.connected) {
    socket.auth = { token }
    socket.connect()
    return socket
  }

  const baseUrl = getWSBaseUrl()

  socket = io(`${baseUrl}/client`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 15000,
    withCredentials: true,
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.log('[Socket.IO] Connected to /client namespace')
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket.IO] Connection error:', err.message)
  })

  return socket
}

/**
 * Update the auth token on the existing socket (after token refresh).
 */
export function updateSocketToken(newToken: string) {
  if (socket) {
    socket.auth = { token: newToken }
    if (!socket.connected) {
      socket.connect()
    }
  }
}

/**
 * Disconnect the socket (e.g., on logout).
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Composable for using Socket.IO in Vue components.
 *
 * Automatically subscribes to order progress rooms and cleans up on unmount.
 */
export function useSocket() {
  const connected: Ref<boolean> = ref(false)
  const subscribedOrders = new Set<string>()
  const progressCallbacks = new Map<string, (data: OrderProgressData) => void>()
  const globalCallbacks: Array<(data: OrderProgressData) => void> = []

  const s = getSocket()
  if (s) {
    connected.value = s.connected
    s.on('connect', () => { connected.value = true })
    s.on('disconnect', () => { connected.value = false })
  }

  /**
   * Subscribe to progress updates for a specific order.
   */
  function subscribeOrder(orderCode: string, callback?: (data: OrderProgressData) => void) {
    const sock = getSocket()
    if (!sock) return

    sock.emit('order:subscribe', orderCode)
    subscribedOrders.add(orderCode)

    if (callback) {
      progressCallbacks.set(orderCode, callback)
    }
  }

  /**
   * Unsubscribe from a specific order's updates.
   */
  function unsubscribeOrder(orderCode: string) {
    const sock = getSocket()
    if (sock) {
      sock.emit('order:unsubscribe', orderCode)
    }
    subscribedOrders.delete(orderCode)
    progressCallbacks.delete(orderCode)
  }

  /**
   * Subscribe to ALL order updates (admin only).
   */
  function subscribeAllOrders() {
    const sock = getSocket()
    if (!sock) return
    sock.emit('orders:subscribe-all')
  }

  /**
   * Register a callback for any order progress event.
   */
  function onOrderProgress(callback: (data: OrderProgressData) => void) {
    globalCallbacks.push(callback)
  }

  // Listen for order:progress events
  if (s) {
    s.on('order:progress', (data: OrderProgressData) => {
      // Call order-specific callback if registered
      const cb = progressCallbacks.get(data.orderCode)
      if (cb) cb(data)

      // Call global callbacks
      for (const gcb of globalCallbacks) {
        gcb(data)
      }
    })
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    const sock = getSocket()
    if (sock) {
      for (const code of subscribedOrders) {
        sock.emit('order:unsubscribe', code)
      }
    }
    subscribedOrders.clear()
    progressCallbacks.clear()
    globalCallbacks.length = 0
  })

  function onGroupChestItemResult(callback: (data: any) => void) {
    const sock = getSocket()
    if (!sock) return () => {}
    sock.on('group-chest:item-result', callback)
    return () => { sock.off('group-chest:item-result', callback) }
  }

  return {
    connected,
    subscribeOrder,
    unsubscribeOrder,
    subscribeAllOrders,
    onOrderProgress,
    onGroupChestItemResult,
  }
}

// ─── Types ─────────────────────────────────────────────────────────

export interface OrderProgressData {
  orderCode: string
  status: string
  ticketsTarget: number
  ticketsConfirmed: number
  completedRequests: number
  totalRequests?: number
  progressPercent: number
  message?: string
}
