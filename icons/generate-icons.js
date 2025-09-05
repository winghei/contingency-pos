const fs = require('fs');
const path = require('path');

// Simple SVG icon generator
function generateSVG(size, text = 'POS') {
  const fontSize = Math.floor(size * 0.4);
  const textY = size / 2 + fontSize / 3;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#66bb6a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#388e3c;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#bg)" stroke="#2e7d32" stroke-width="2"/>
  
  <!-- Cash register icon -->
  <g transform="translate(${size/2 - size*0.15}, ${size/2 - size*0.1})">
    <!-- Register body -->
    <rect x="0" y="${size*0.05}" width="${size*0.3}" height="${size*0.15}" fill="#ffffff" rx="2"/>
    <!-- Display screen -->
    <rect x="${size*0.02}" y="${size*0.07}" width="${size*0.26}" height="${size*0.08}" fill="#4caf50" rx="1"/>
    <!-- Buttons -->
    <circle cx="${size*0.08}" cy="${size*0.18}" r="${size*0.015}" fill="#666"/>
    <circle cx="${size*0.15}" cy="${size*0.18}" r="${size*0.015}" fill="#666"/>
    <circle cx="${size*0.22}" cy="${size*0.18}" r="${size*0.015}" fill="#666"/>
    <!-- Drawer -->
    <rect x="${size*0.05}" y="${size*0.2}" width="${size*0.2}" height="${size*0.03}" fill="#8d6e63" rx="1"/>
  </g>
  
  <!-- Text -->
  <text x="${size/2}" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="#ffffff">${text}</text>
</svg>`;
}

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating PWA icons...');

sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(__dirname, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Generated ${filename}`);
});

// Generate shortcut icons
const shortcuts = [
  { name: 'shortcut-order', text: 'ORD' },
  { name: 'shortcut-orders', text: 'LST' },
  { name: 'shortcut-products', text: 'PRD' }
];

shortcuts.forEach(shortcut => {
  const svg = generateSVG(96, shortcut.text);
  const filename = `${shortcut.name}.svg`;
  const filepath = path.join(__dirname, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Generated ${filename}`);
});

console.log('All icons generated successfully!');
console.log('Note: These are SVG files. For PWA, you may want to convert them to PNG format.');
