const fs = require('fs');
const path = require('path');

const lyricsDir = path.join(__dirname, '../public/data/lyrics');
const files = fs.readdirSync(lyricsDir).filter(f => f.endsWith('.json'));

console.log('Checking if lyrics are in chronological order:\n');
console.log('=' .repeat(60));

let issuesFound = [];

files.forEach(file => {
  const filePath = path.join(lyricsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  console.log(`\n📄 ${data.trackName} - ${data.artistName}`);
  console.log(`   File: ${file}`);

  let hasIssue = false;
  let prevTimestamp = -1;

  // Check if timestamps are in ascending order
  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];

    if (line.timestamp < prevTimestamp) {
      if (!hasIssue) {
        console.log(`   ⚠️  ORDERING ISSUE FOUND:`);
        hasIssue = true;
      }
      console.log(`      Line ${i}: [${(line.timestamp/1000).toFixed(2)}s] "${line.text.substring(0, 40)}..."`);
      console.log(`         ^ This comes AFTER line ${i-1} at ${(prevTimestamp/1000).toFixed(2)}s`);
    }

    prevTimestamp = line.timestamp;
  }

  if (!hasIssue) {
    console.log(`   ✅ Timestamps are in correct order`);
  } else {
    issuesFound.push({
      track: data.trackName,
      artist: data.artistName,
      file: file
    });
  }
});

console.log('\n' + '=' .repeat(60));
if (issuesFound.length > 0) {
  console.log(`\n⚠️  Found ordering issues in ${issuesFound.length} tracks:`);
  issuesFound.forEach(issue => {
    console.log(`   - ${issue.track} by ${issue.artist}`);
    console.log(`     File: ${issue.file}`);
  });
  console.log('\nThese tracks may need their LRC files re-applied without sorting.');
} else {
  console.log('\n✅ All tracks have lyrics in correct chronological order!');
}