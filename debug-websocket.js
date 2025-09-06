// Debug script to help troubleshoot WebSocket issues
// Run this in the browser console to check WebSocket connectivity

console.log('=== WebSocket Debug Information ===');

// Check if WebSocket is supported
console.log('WebSocket supported:', typeof WebSocket !== 'undefined');

// Check service worker status
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (registration) {
      console.log('Service Worker registered:', registration);
      console.log('Service Worker active:', !!registration.active);
      console.log('Service Worker scope:', registration.scope);
    } else {
      console.log('No Service Worker registered');
    }
  });
} else {
  console.log('Service Worker not supported');
}

// Test WebSocket connection
function testWebSocket() {
  const wsUrl = 'ws://localhost:4200/?token=test';
  console.log('Testing WebSocket connection to:', wsUrl);
  
  try {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = function(event) {
      console.log('✅ WebSocket connection opened successfully');
      ws.close();
    };
    
    ws.onerror = function(error) {
      console.log('❌ WebSocket connection failed:', error);
    };
    
    ws.onclose = function(event) {
      console.log('WebSocket connection closed:', event.code, event.reason);
    };
    
    // Close after 5 seconds if still open
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }, 5000);
    
  } catch (error) {
    console.log('❌ WebSocket creation failed:', error);
  }
}

// Run the test
testWebSocket();

// Check for any existing WebSocket connections
console.log('Current location:', window.location.href);
console.log('User agent:', navigator.userAgent);
