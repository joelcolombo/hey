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
const lrcPath = '/Users/joelcolombo/Downloads/Illya Kuryaki & The Valderramas - Monta El Trueno.lrc';
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

// Create the JSON structure
const jsonData = {
  trackId: "05-monta-el-trueno-illya-kuryaki-valderramas",
  trackName: "Monta El Trueno",
  artistName: "Illya Kuryaki & The Valderramas",
  lines: jsonLines
};

// Find the correct output file based on the mapping
// Looking up the mapping for "ik-monta-el-trueno"
const outputPath = path.join(__dirname, '../public/data/lyrics/d4d0e1eb351ac34cf768a7c2d1e6d8f5.json');

console.log('Converting LRC to JSON format...\n');
console.log('Track:', jsonData.trackName, 'by', jsonData.artistName);
console.log('Number of lines:', jsonData.lines.length);
console.log('\nTimestamp comparison:');
if (jsonData.lines.length > 0) {
  console.log('First line:', (jsonData.lines[0].timestamp / 1000).toFixed(2), 's');
  console.log('Last line:', (jsonData.lines[jsonData.lines.length - 1].timestamp / 1000).toFixed(2), 's');
}

// Show first few lines with their timestamps
console.log('\nFirst 10 lines with timestamps:');
jsonData.lines.slice(0, 10).forEach((line, index) => {
  console.log(`${index + 1}. [${(line.timestamp / 1000).toFixed(2)}s] ${line.text}`);
});

if (jsonData.lines.length > 10) {
  console.log(`... and ${jsonData.lines.length - 10} more lines`);
}

// Write the JSON file
fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));

console.log('\n✅ Successfully converted and saved to:', outputPath);