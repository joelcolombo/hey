const fs = require('fs');
const path = require('path');

// Files to clean
const filesToClean = [
  'components/PlaylistView.tsx',
  'components/AlbumDisplay.tsx',
  'hooks/useAudioPlayer.ts',
  'app/api/media/route.ts'
];

filesToClean.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalLines = content.split('\n');
  let modifiedLines = [];
  let removedCount = 0;

  for (let i = 0; i < originalLines.length; i++) {
    const line = originalLines[i];
    // Check if line contains console.log
    if (line.includes('console.log')) {
      removedCount++;
      // Skip this line
      continue;
    }
    modifiedLines.push(line);
  }

  if (removedCount > 0) {
    fs.writeFileSync(filePath, modifiedLines.join('\n'));
    console.log(`✅ Cleaned ${file} - removed ${removedCount} console.log lines`);
  } else {
    console.log(`   ${file} - no console.log statements found`);
  }
});

console.log('\n✅ All console.log statements removed!');