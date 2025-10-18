import { NextRequest, NextResponse } from 'next/server';
import { mediaMapping } from '@/lib/media-mapping';
import fs from 'fs';
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

  const filePath = path.join(process.cwd(), 'public', 'data', folder, filename);

  // Debug logging for lyrics
  if (type === 'lyrics') {
  }

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Debug log first few lines of lyrics
    if (type === 'lyrics') {
      const content = JSON.parse(fileBuffer.toString());
      content.lines?.slice(0, 3).forEach((line: any, i: number) => {
      });
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        // Reduce cache for lyrics to allow updates
        'Cache-Control': type === 'lyrics'
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving media file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
