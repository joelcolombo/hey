import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const playDir = path.join(process.cwd(), 'public', 'play');

    // Check if directory exists
    if (!fs.existsSync(playDir)) {
      return NextResponse.json({ projects: [] });
    }

    // Read directory contents
    const items = fs.readdirSync(playDir);

    // Filter for directories only and get their details
    const projects = items
      .filter(item => {
        const itemPath = path.join(playDir, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .map(folder => {
        // Format the folder name for display (e.g., "billiards" -> "Billiards")
        const displayName = folder
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return {
          id: folder,
          name: displayName,
          path: `/play/${folder}`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error reading play directory:', error);
    return NextResponse.json({ projects: [], error: 'Failed to load projects' });
  }
}