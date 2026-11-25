// Bilge's full-screen choice owns input through the same queue as every other overlay.
const fs = require('fs');
const overlay = fs.readFileSync('js/overlay.js', 'utf8');
const road = fs.readFileSync('js/conduits-road.js', 'utf8');
if (!/OVERLAY_STATES\s*=\s*\{[^}]*\bFERRY\s*:\s*1/.test(overlay)) throw new Error('FERRY is not a registered overlay state');
if (!/function\s+k2FerryOpen\s*\(\)\s*\{[\s\S]*?overlayRequest\s*\([\s\S]*?G\.state\s*=\s*['"]FERRY['"][\s\S]*?['"]ferry['"]\s*\)/.test(road)) throw new Error('FERRY bypasses overlayRequest');
console.log('PASS Bilge ferry choices acquire centralized overlay ownership');
