const fs = require('fs');
const path = require('path');

const lyricsDir = path.join(__dirname, '../public/data/lyrics');

// Get all JSON files
const files = fs.readdirSync(lyricsDir).filter(f => f.endsWith('.json'));

console.log(`Found ${files.length} lyrics files to check\n`);

let totalIssues = 0;

files.forEach(file => {
  const filePath = path.join(lyricsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  console.log(`\n📄 Checking: ${file}`);
  console.log(`   Track: ${data.trackName} by ${data.artistName}`);

  let hasIssues = false;
  const duplicateTimestamps = {};
  const outOfOrderLines = [];

  // Check for duplicate timestamps and out of order lines
  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    const timestamp = line.timestamp;

    // Check for duplicates
    if (duplicateTimestamps[timestamp]) {
      duplicateTimestamps[timestamp].push(i);
    } else {
      duplicateTimestamps[timestamp] = [i];
    }

    // Check if out of order (timestamp less than previous)
    if (i > 0 && timestamp < data.lines[i - 1].timestamp) {
      outOfOrderLines.push({
        index: i,
        timestamp,
        prevTimestamp: data.lines[i - 1].timestamp,
        text: line.text
      });
    }
  }

  // Report duplicate timestamps
  Object.entries(duplicateTimestamps).forEach(([timestamp, indices]) => {
    if (indices.length > 1) {
      hasIssues = true;
      totalIssues++;
      console.log(`   ⚠️  Duplicate timestamp ${timestamp}ms at lines ${indices.join(', ')}:`);
      indices.forEach(idx => {
        console.log(`      Line ${idx}: "${data.lines[idx].text.substring(0, 50)}..."`);
      });
    }
  });

  // Report out of order lines
  if (outOfOrderLines.length > 0) {
    hasIssues = true;
    totalIssues += outOfOrderLines.length;
    console.log(`   ⚠️  Out of order timestamps:`);
    outOfOrderLines.forEach(item => {
      console.log(`      Line ${item.index}: ${item.timestamp}ms < ${item.prevTimestamp}ms - "${item.text.substring(0, 50)}..."`);
    });
  }

  if (!hasIssues) {
    console.log(`   ✅ No issues found`);
  }

  // Fix the issues
  if (hasIssues) {
    console.log(`   🔧 Fixing issues...`);

    // Fix duplicate timestamps by adding small offsets
    let fixedLines = [...data.lines];
    const processedTimestamps = new Set();

    for (let i = 0; i < fixedLines.length; i++) {
      let timestamp = fixedLines[i].timestamp;
      let offset = 0;

      // If timestamp already exists, add small offset
      while (processedTimestamps.has(timestamp + offset)) {
        offset += 50; // Add 50ms offset for each duplicate
      }

      if (offset > 0) {
        fixedLines[i] = { ...fixedLines[i], timestamp: timestamp + offset };
        console.log(`      Fixed line ${i}: ${timestamp}ms → ${timestamp + offset}ms`);
      }

      processedTimestamps.add(fixedLines[i].timestamp);
    }

    // Sort lines by timestamp to fix ordering issues
    fixedLines.sort((a, b) => a.timestamp - b.timestamp);

    // Save the fixed file
    const fixedData = { ...data, lines: fixedLines };
    fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2));
    console.log(`   ✅ Fixed and saved!`);
  }
});

console.log(`\n========================================`);
console.log(`Total issues found and fixed: ${totalIssues}`);
console.log(`========================================\n`);