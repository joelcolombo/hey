import { NextResponse } from 'next/server'

export const maxDuration = 60

const MAX_BYTES = 8 * 1024 * 1024 // ~180s of webm/opus is well under this

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return NextResponse.json({ error: 'transcription not configured' }, { status: 503 })

  let audio: File | null = null
  try {
    const form = await req.formData()
    const entry = form.get('audio')
    if (entry instanceof File) audio = entry
  } catch {
    /* fall through */
  }
  if (!audio || audio.size === 0) return NextResponse.json({ error: 'no audio' }, { status: 422 })
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: 'audio too large' }, { status: 422 })

  const out = new FormData()
  // Detect format from MIME type or filename
  let ext = 'webm'
  if (audio.type.includes('mp4') || audio.type.includes('m4a')) ext = 'm4a'
  else if (audio.type.includes('mp3') || audio.type.includes('mpeg')) ext = 'mp3'
  else if (audio.type.includes('ogg') || audio.type.includes('oga')) ext = 'ogg'
  else if (audio.type.includes('wav')) ext = 'wav'
  else if (audio.type.includes('flac')) ext = 'flac'
  else if (audio.type.includes('webm')) ext = 'webm'
  // Try to extract extension from filename if available
  if (audio.name) {
    const nameExt = audio.name.split('.').pop()?.toLowerCase()
    if (nameExt && ['m4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm', 'flac'].includes(nameExt)) {
      ext = nameExt
    }
  }
  const buffer = await audio.arrayBuffer()
  out.append('file', new Blob([buffer], { type: audio.type }), `note.${ext}`)
  out.append('model', 'whisper-1')

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: out,
    })
    if (!res.ok) {
      const errBody = await res.text()
      console.error('[questionnaire/transcribe] whisper failed', res.status, errBody)
      return NextResponse.json({ error: 'transcription failed' }, { status: 502 })
    }
    const data = (await res.json()) as { text?: string }
    return NextResponse.json({ text: data.text ?? '' })
  } catch (err) {
    console.error('[questionnaire/transcribe]', err)
    return NextResponse.json({ error: 'transcription failed' }, { status: 502 })
  }
}
