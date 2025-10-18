const fs = require('fs');
const path = require('path');

// Parse LRC timestamp format [mm:ss.xx] to milliseconds
function parseLrcTimestamp(timestamp) {
  const match = timestamp.match(/\[(\d{2}):(\d{2})\.(\d{2})\]/);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const hundredths = parseInt(match[3], 10);

  return (minutes * 60 * 1000) + (seconds * 1000) + (hundredths * 10);
}

// Read the LRC file
const lrcPath = '/Users/joelcolombo/Downloads/Toro y Moi - Never Matter.lrc';
const lrcContent = fs.readFileSync(lrcPath, 'utf8');

// Parse the LRC content
const lines = lrcContent.split('\n');
const jsonLines = [];

lines.forEach(line => {
  // Skip metadata lines and empty lines
  if (line.startsWith('[ar:') || line.startsWith('[al:') ||
      line.startsWith('[ti:') || line.startsWith('[id:') ||
      line.startsWith('[length:') || line.trim() === '') {
    return;
  }

  // Extract timestamp and text
  const timestampMatch = line.match(/^\[(\d{2}:\d{2}\.\d{2})\](.*)$/);
  if (timestampMatch) {
    const timestamp = parseLrcTimestamp(`[${timestampMatch[1]}]`);
    const text = timestampMatch[2].trim();

    if (timestamp !== null && text) {
      jsonLines.push({
        timestamp,
        text
      });
    }
  }
});

// Create the JSON structure - DO NOT SORT, preserve original order
const jsonData = {
  trackId: "03-never-matter-toro-y-moi",
  trackName: "Never Matter",
  artistName: "Toro y Moi",
  lines: jsonLines // Keep original order from LRC file
};

// Save to the correct location
const outputPath = path.join(__dirname, '../public/data/lyrics/b7c995a5d02f97a124c64cb957811b4b.json');

console.log('Converting LRC to JSON format...\n');
console.log('Track:', jsonData.trackName, 'by', jsonData.artistName);
console.log('Number of lines:', jsonData.lines.length);
console.log('\nTimestamp comparison:');
console.log('First line:', (jsonData.lines[0].timestamp / 1000).toFixed(2), 's');
console.log('Last line:', (jsonData.lines[jsonData.lines.length - 1].timestamp / 1000).toFixed(2), 's');

// Show all lines with their timestamps
console.log('\nAll lines with timestamps:');
jsonData.lines.forEach((line, index) => {
  console.log(`${index + 1}. [${(line.timestamp / 1000).toFixed(2)}s] ${line.text}`);
});

// Write the JSON file
fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

console.log('\n✅ Successfully converted and saved to:', outputPath);