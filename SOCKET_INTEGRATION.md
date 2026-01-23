# Socket.IO Integration Guide

This document explains how to integrate Socket.IO for real-time order notifications in the admin panel.

## Backend Setup

The backend is already configured with Socket.IO. The server emits the following events:

### Events Emitted by Server

1. **`order:new`** - Emitted when a new order is created
   - Data: `{ order, timestamp, sound: true }`
   - Only sent to admin users

2. **`order:status-updated`** - Emitted when an order status is updated
   - Data: `{ order, timestamp }`
   - Only sent to admin users

3. **`admin:connected`** - Confirmation when admin successfully connects
   - Data: `{ message, userId }`

## Frontend Integration

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Create Socket Connection

```javascript
import { io } from 'socket.io-client';

// Get JWT token from your auth system
const token = localStorage.getItem('token'); // or however you store the token

// Connect to socket server
const socket = io('http://localhost:3000', {
  auth: {
    token: token // Send JWT token for authentication
  },
  transports: ['websocket', 'polling']
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to server');
});

// Handle admin connection confirmation
socket.on('admin:connected', (data) => {
  console.log('Admin connected:', data);
});
```

### 3. Listen for New Orders

```javascript
// Listen for new orders
socket.on('order:new', (data) => {
  const { order, timestamp, sound } = data;
  
  // Play ringtone if sound flag is true
  if (sound) {
    playNotificationSound();
  }
  
  // Update your orders list
  // Add the new order to the top of your orders list
  setOrders(prevOrders => [order, ...prevOrders]);
  
  // Show notification toast/alert
  showNotification(`New order received: ${order.orderNumber}`);
});

// Function to play notification sound
function playNotificationSound() {
  // Option 1: Use HTML5 Audio
  const audio = new Audio('/path/to/notification-sound.mp3');
  audio.play().catch(err => console.error('Error playing sound:', err));
  
  // Option 2: Use Web Audio API for a simple beep
  // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  // const oscillator = audioContext.createOscillator();
  // const gainNode = audioContext.createGain();
  // oscillator.connect(gainNode);
  // gainNode.connect(audioContext.destination);
  // oscillator.frequency.value = 800;
  // oscillator.type = 'sine';
  // gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  // gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  // oscillator.start(audioContext.currentTime);
  // oscillator.stop(audioContext.currentTime + 0.5);
}
```

### 4. Listen for Order Status Updates

```javascript
socket.on('order:status-updated', (data) => {
  const { order, timestamp } = data;
  
  // Update the order in your orders list
  setOrders(prevOrders => 
    prevOrders.map(o => o._id === order._id ? order : o)
  );
});
```

### 5. Handle Disconnection

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
  // Optionally attempt to reconnect
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Handle authentication errors
  if (error.message.includes('Authentication')) {
    // Token might be invalid, redirect to login
    // window.location.href = '/login';
  }
});
```

### 6. React Hook Example

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useAdminSocket(token) {
  const [socket, setSocket] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Create socket connection
    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Connection handlers
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    // Admin confirmation
    newSocket.on('admin:connected', (data) => {
      console.log('Admin confirmed:', data);
    });

    // New order handler
    newSocket.on('order:new', (data) => {
      const { order, sound } = data;
      
      // Play sound
      if (sound) {
        playNotificationSound();
      }
      
      // Add to orders
      setOrders(prev => [order, ...prev]);
      
      // Show notification
      // You can use a toast library here
      alert(`New order: ${order.orderNumber}`);
    });

    // Order status update handler
    newSocket.on('order:status-updated', (data) => {
      const { order } = data;
      setOrders(prev => 
        prev.map(o => o._id === order._id ? order : o)
      );
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, orders, isConnected, setOrders };
}

// Usage in component
function AdminOrdersPage() {
  const token = localStorage.getItem('token');
  const { orders, isConnected } = useAdminSocket(token);

  return (
    <div>
      <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <h1>Orders ({orders.length})</h1>
      {/* Render orders */}
    </div>
  );
}
```

## Environment Variables

Make sure to set the `CLIENT_URL` in your `.env` file for CORS:

```env
CLIENT_URL=http://localhost:3001
```

Or set it to `*` for development (not recommended for production).

## Authentication

The socket connection requires a valid JWT token. The token should be sent in the `auth.token` field when connecting. Only users with the `admin` role will receive order notifications.

## Notes

- The socket automatically joins admin users to the "admin" room
- Only admin users receive `order:new` and `order:status-updated` events
- The `sound: true` flag in `order:new` events indicates that a notification sound should be played
- Make sure to handle reconnection logic in your frontend for production use
