# WebSocket Connection Troubleshooting

## Issue
WebSocket connection to 'ws://localhost:4200/?token=hh2q20I1SgJI' failed

## Quick Solutions

### 1. Clear Service Worker Cache
```bash
# Open browser dev tools (F12)
# Go to Application tab > Storage > Clear storage
# Or run in console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

### 2. Restart Development Servers
```bash
# Stop all running processes (Ctrl+C)
# Then restart:
npm run dev
# Or separately:
npm start
npm run server
```

### 3. Check Port Conflicts
```bash
# Check if port 4200 is in use
lsof -i :4200
# Check if port 3001 is in use  
lsof -i :3001
```

### 4. Disable Service Worker Temporarily
Comment out the service worker registration in `src/main.ts`:
```typescript
// Comment out this section temporarily
/*
if ('serviceWorker' in navigator) {
  // ... service worker code
}
*/
```

## Root Causes

### 1. Service Worker Interference
The service worker was intercepting WebSocket connections. Fixed by:
- Adding WebSocket protocol checks
- Adding upgrade header checks
- Excluding WebSocket URLs from caching

### 2. Angular Dev Server Configuration
The Angular dev server uses WebSockets for:
- Hot module replacement (HMR)
- Live reloading
- Development server communication

### 3. Port Conflicts
Multiple services trying to use the same ports.

## Permanent Fixes Applied

### 1. Updated Service Worker (`public/sw.js`)
```javascript
// Skip service worker for WebSocket upgrade requests
if (request.headers.get('upgrade') === 'websocket') {
  return;
}

// Skip service worker for Angular dev server WebSocket connections
if (url.protocol === 'ws:' || url.protocol === 'wss:') {
  return;
}
```

### 2. Improved Service Worker Registration (`src/main.ts`)
- Added proper error handling
- Added scope configuration
- Improved update handling

## Testing the Fix

### 1. Clear Browser Cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear application storage in dev tools

### 2. Check Service Worker Status
Open browser console and run:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', !!reg);
  console.log('SW active:', !!reg?.active);
});
```

### 3. Test WebSocket Connection
Run the debug script in browser console:
```javascript
// Copy and paste the content of debug-websocket.js
```

## Development Workflow

### Recommended Startup Sequence
1. Start backend server: `npm run server`
2. Start frontend: `npm start`
3. Or use combined: `npm run dev`

### If Issues Persist
1. **Disable service worker temporarily** for development
2. **Use different ports** if conflicts exist
3. **Check firewall/antivirus** blocking WebSocket connections
4. **Try different browser** to isolate browser-specific issues

## Production Considerations

For production deployment:
- Service worker will work normally (no dev server WebSockets)
- WebSocket connections will be for your application only
- Consider using HTTPS/WSS for production WebSockets

## Browser-Specific Issues

### Chrome/Edge
- Check if extensions are blocking WebSockets
- Disable extensions temporarily

### Firefox
- Check about:config for WebSocket settings
- Ensure `network.websocket.enabled` is true

### Safari
- Check Develop menu > Web Inspector settings
- Ensure WebSocket debugging is enabled

## Network Issues

### Corporate Networks
- Some corporate firewalls block WebSocket connections
- Try using different network or VPN

### Local Network
- Check if local firewall is blocking connections
- Ensure localhost is not blocked

## Debug Information

To get detailed debug information, run in browser console:
```javascript
// Check WebSocket support
console.log('WebSocket supported:', typeof WebSocket !== 'undefined');

// Check service worker
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg);
});

// Test WebSocket
const ws = new WebSocket('ws://localhost:4200/?token=test');
ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (e) => console.log('WebSocket error:', e);
```

## Contact

If issues persist after trying these solutions, check:
1. Browser console for additional error messages
2. Network tab in dev tools for failed requests
3. Service worker tab for registration issues
