const fs = require('fs');
const path = require('path');

// Simple PNG generator using base64 data
function generatePNGIcon(size, text = 'POS') {
  // This is a simple approach - in a real scenario, you'd use a proper image library
  // For now, we'll create a simple colored square with text
  
  const canvas = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; }
        canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="canvas" width="${size}" height="${size}"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const size = ${size};
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#66bb6a');
        gradient.addColorStop(1, '#388e3c');
        
        // Draw background circle
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw cash register icon
        const iconSize = size * 0.3;
        const iconX = size/2 - iconSize/2;
        const iconY = size/2 - iconSize/2;
        
        // Register body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(iconX, iconY + iconSize*0.1, iconSize, iconSize*0.4);
        
        // Display screen
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(iconX + iconSize*0.05, iconY + iconSize*0.15, iconSize*0.9, iconSize*0.2);
        
        // Buttons
        ctx.fillStyle = '#666';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(iconX + iconSize*0.2 + i*iconSize*0.2, iconY + iconSize*0.5, iconSize*0.05, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Drawer
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(iconX + iconSize*0.1, iconY + iconSize*0.6, iconSize*0.8, iconSize*0.1);
        
        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold ' + (size * 0.15) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('${text}', size/2, size/2 + size*0.25);
        
        // Convert to data URL
        const dataURL = canvas.toDataURL('image/png');
        document.body.innerHTML = '<img src="' + dataURL + '">';
    </script>
</body>
</html>`;
  
  return canvas;
}

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating PNG icon HTML files...');

sizes.forEach(size => {
  const html = generatePNGIcon(size);
  const filename = `icon-${size}x${size}.html`;
  const filepath = path.join(__dirname, filename);
  
  fs.writeFileSync(filepath, html);
  console.log(`Generated ${filename}`);
});

// Generate shortcut icons
const shortcuts = [
  { name: 'shortcut-order', text: 'ORD' },
  { name: 'shortcut-orders', text: 'LST' },
  { name: 'shortcut-products', text: 'PRD' }
];

shortcuts.forEach(shortcut => {
  const html = generatePNGIcon(96, shortcut.text);
  const filename = `${shortcut.name}.html`;
  const filepath = path.join(__dirname, filename);
  
  fs.writeFileSync(filepath, html);
  console.log(`Generated ${filename}`);
});

console.log('All icon HTML files generated!');
console.log('Open each HTML file in a browser and save the image as PNG.');
