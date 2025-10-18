const fs = require('fs');
const path = require('path');

// Read the Never Matter lyrics file
const filePath = path.join(__dirname, '../public/data/lyrics/b7c995a5d02f97a124c64cb957811b4b.json');
const content = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(content);

console.log('Fixing "Never Matter" by Toro y Moi timestamps...\n');
console.log('Current first lyric timestamp:', data.lines[0].timestamp, 'ms');

// The song starts with vocals almost immediately
// Shift all timestamps back by about 56 seconds (56000ms)
// Let's start the first line at 800ms (0.8 seconds)
const offset = data.lines[0].timestamp - 800;

console.log('Offset to apply:', -offset, 'ms\n');

// Apply the offset to all lines
const fixedLines = data.lines.map((line, index) => {
  const oldTime = line.timestamp;
  const newTime = Math.max(0, line.timestamp - offset);

  console.log(`Line ${index + 1}: ${(oldTime/1000).toFixed(1)}s -> ${(newTime/1000).toFixed(1)}s`);

  return {
    ...line,
    timestamp: newTime
  };
});

// Update the data
data.lines = fixedLines;

// Save the fixed file
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log('\n✅ Fixed and saved!');
console.log('New first lyric timestamp:', data.lines[0].timestamp, 'ms (' + (data.lines[0].timestamp/1000).toFixed(1) + 's)');