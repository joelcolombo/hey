import { NextRequest, NextResponse } from 'next/server';
import { mediaMapping } from '@/lib/media-mapping';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // 'song', 'cover', or 'lyrics'

  if (!id || !type) {
    return NextResponse.json({ error: 'Missing id or type parameter' }, { status: 400 });
  }

  const mapping = mediaMapping[id];
  if (!mapping) {
    return NextResponse.json({ error: 'Invalid media ID' }, { status: 404 });
  }

  let filename: string;
  let folder: string;
  let contentType: string;

  switch (type) {
    case 'song':
      filename = mapping.song;
      folder = 'songs';
      contentType = 'audio/mpeg';
      break;
    case 'cover':
      filename = mapping.cover;
      folder = 'covers';
      contentType = filename.endsWith('.jpg') ? 'image/jpeg' : 'image/jpeg';
      break;
    case 'lyrics':
      filename = mapping.lyrics;
      folder = 'lyrics';
      contentType = 'application/json';
      break;
    default:
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  }

  try {
    // For production on Vercel, files in the public directory are available
    // We use path.join with process.cwd() to get the absolute path
    const publicDirectory = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDirectory, 'data', folder, filename);

    // Debug logging
    if (type === 'lyrics') {
      console.log('Attempting to read file from:', filePath);
      console.log('Current working directory:', process.cwd());

      // Check if public directory exists
      try {
        const publicExists = await fs.access(publicDirectory);
        console.log('Public directory exists');
      } catch {
        console.log('Public directory not found, trying alternative paths');

        // In production, try to read directly from the data folder
        const altPath = path.join(process.cwd(), 'data', folder, filename);
        const fileBuffer = await fs.readFile(altPath);

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': type === 'lyrics'
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': type === 'lyrics'
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving media file:', error);
    console.error('Attempted path:', path.join(process.cwd(), 'public', 'data', folder, filename));

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'File not found',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 404 });
  }
}