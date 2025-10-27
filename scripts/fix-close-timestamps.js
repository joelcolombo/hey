const fs = require('fs');
const path = require('path');

const lyricsDir = path.join(__dirname, '../public/data/lyrics');
const MIN_GAP_MS = 1000; // Minimum 1 second between lines

// Get all JSON files
const files = fs.readdirSync(lyricsDir).filter(f => f.endsWith('.json'));

console.log(`Found ${files.length} lyrics files to check\n`);

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(lyricsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  console.log(`\n📄 Checking: ${file}`);
  console.log(`   Track: ${data.trackName} by ${data.artistName}`);

  let modified = false;
  const fixedLines = [...data.lines];

  // Check each line against the previous one
  for (let i = 1; i < fixedLines.length; i++) {
    const prevLine = fixedLines[i - 1];
    const currentLine = fixedLines[i];
    const gap = currentLine.timestamp - prevLine.timestamp;

    if (gap < MIN_GAP_MS && gap > 0) {
      console.log(`   ⚠️  Found gap of only ${gap}ms at index ${i}`);
      console.log(`      Before: ${prevLine.timestamp}ms -> ${currentLine.timestamp}ms`);

      // Adjust current timestamp to maintain minimum gap
      currentLine.timestamp = prevLine.timestamp + MIN_GAP_MS;

      console.log(`      After:  ${prevLine.timestamp}ms -> ${currentLine.timestamp}ms`);
      console.log(`      Text: "${currentLine.text}"`);

      modified = true;
      totalFixed++;
    }
  }

  if (modified) {
    // Save the fixed file
    const fixedData = {
      ...data,
      lines: fixedLines
    };

    fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2), 'utf8');
    console.log(`   ✅ Fixed and saved!`);
  } else {
    console.log(`   ✅ No issues found`);
  }
});

console.log(`\n========================================`);
console.log(`Total timestamps fixed: ${totalFixed}`);
console.log(`========================================\n`);