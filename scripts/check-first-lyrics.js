const fs = require('fs');
const path = require('path');

const lyricsDir = path.join(__dirname, '../public/data/lyrics');
const files = fs.readdirSync(lyricsDir).filter(f => f.endsWith('.json'));

console.log('Checking first lyric timestamps for all tracks:\n');
console.log('=' .repeat(60));

const tracks = [];

files.forEach(file => {
  const filePath = path.join(lyricsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  if (data.lines && data.lines.length > 0) {
    const firstTimestamp = data.lines[0].timestamp;
    const firstTimeSec = (firstTimestamp / 1000).toFixed(1);

    tracks.push({
      file,
      trackName: data.trackName,
      artistName: data.artistName,
      firstTimestamp,
      firstTimeSec,
      firstLine: data.lines[0].text
    });
  }
});

// Sort by first timestamp
tracks.sort((a, b) => a.firstTimestamp - b.firstTimestamp);

tracks.forEach(track => {
  const flag = track.firstTimestamp > 30000 ? '⚠️ ' : '  ';
  console.log(`${flag}${track.trackName} - ${track.artistName}`);
  console.log(`   First lyric at: ${track.firstTimeSec}s`);
  console.log(`   "${track.firstLine}"`);
  console.log();
});

console.log('\n' + '=' .repeat(60));
console.log('Tracks with potentially incorrect first timestamps (>30s):');
const suspicious = tracks.filter(t => t.firstTimestamp > 30000);
if (suspicious.length > 0) {
  suspicious.forEach(track => {
    console.log(`- ${track.trackName} (${track.firstTimeSec}s) - ${track.file}`);
  });
} else {
  console.log('None found - all tracks start within 30 seconds');
}