import { NextResponse } from 'next/server'

export const maxDuration = 60

const MAX_BYTES = 3.5 * 1024 * 1024 // Vercel body-limit headroom

// Cross-site abuse guard: reject requests whose Origin/Referer names a
// different host than the one being called (same-origin form posts pass
// through; curl/script floods from other sites don't).
function sameOrigin(req: Request): boolean {
  const from = req.headers.get('origin') ?? req.headers.get('referer')
  if (!from) return true
  const host = req.headers.get('x-forwarded-host') ?? new URL(req.url).host
  try {
    return new URL(from).host === host
  } catch {
    return false
  }
}

// Simple in-memory per-IP rate limit — good enough for a low-traffic route on
// a single serverless instance; resets on cold start, pruned opportunistically.
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 30
const hits = new Map<string, { count: number; reset: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  if (hits.size > 1000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
  const entry = hits.get(ip)
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_MAX
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(ip)) return NextResponse.json({ error: 'too many requests' }, { status: 429 })

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
  let ext = audio.type.includes('mp4') ? 'mp4' : audio.type.includes('ogg') ? 'ogg' : 'webm'
  // Prefer filename extension if available to match Whisper's strict format validation
  if (audio.name) {
    const nameExt = audio.name.split('.').pop()?.toLowerCase()
    if (nameExt && ['webm', 'ogg', 'mp4', 'm4a'].includes(nameExt)) ext = nameExt
  }
  out.append('file', audio, `note.${ext}`)
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
