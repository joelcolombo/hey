'use client'

import { useEffect, useRef, useState } from 'react'

const MAX_SECONDS = 180
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']

const supported = () =>
  typeof window !== 'undefined' &&
  typeof MediaRecorder !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const extFromMime = (mime: string): string => {
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

type State = 'idle' | 'recording' | 'transcribing' | 'error' | 'denied'

export default function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [available] = useState(supported)
  const [state, setState] = useState<State>('idle')
  const [elapsed, setElapsed] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const tickRef = useRef<number | undefined>(undefined)
  const onTranscriptRef = useRef(onTranscript)
  const startingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const stopTracks = (stream?: MediaStream) => {
    const s = stream || recorderRef.current?.stream
    s?.getTracks().forEach((t) => t.stop())
  }

  useEffect(
    () => () => {
      if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
      stopTracks()
      window.clearInterval(tickRef.current)
      abortRef.current?.abort()
    },
    []
  )

  if (!available) return null

  const start = async () => {
    if (startingRef.current) return
    startingRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      recorderRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      rec.onstop = () => {
        stopTracks()
        window.clearInterval(tickRef.current)
        void transcribe(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }))
      }
      rec.start()
      setElapsed(0)
      setState('recording')
      const startedAt = Date.now()
      tickRef.current = window.setInterval(() => {
        const s = (Date.now() - startedAt) / 1000
        setElapsed(s)
        if (s >= MAX_SECONDS && rec.state === 'recording') rec.stop()
      }, 250)
    } catch {
      setState('denied')
    } finally {
      startingRef.current = false
    }
  }

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const transcribe = async (blob: Blob) => {
    setState('transcribing')
    const abort = new AbortController()
    abortRef.current = abort

    try {
      const form = new FormData()
      const ext = extFromMime(blob.type)
      form.append('audio', new File([blob], `note.${ext}`, { type: blob.type }))
      const res = await fetch('/api/questionnaire/transcribe', {
        method: 'POST',
        body: form,
        signal: abort.signal,
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { text: string }
      if (data.text.trim()) onTranscriptRef.current(data.text.trim())
      setState('idle')
    } catch (err) {
      if (abort.signal.aborted) return
      setState('error')
    }
  }

  if (state === 'denied')
    return <p className="text-[0.85em] text-[var(--hover-color)]">Microphone blocked — you can keep typing.</p>

  return (
    <div className="flex items-center gap-4 text-[0.9em]">
      {state === 'recording' ? (
        <button type="button" onClick={stop}
          className="inline-flex items-center gap-2 border border-[var(--foreground)] rounded-full px-5 py-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          Stop · {fmt(elapsed)}
        </button>
      ) : (
        <button type="button" onClick={() => void start()} disabled={state === 'transcribing'}
          className="inline-flex items-center gap-2 border border-[var(--hover-color)] rounded-full px-5 py-2 hover:border-[var(--foreground)] transition-colors disabled:opacity-40">
          🎙 {state === 'transcribing' ? 'Transcribing…' : 'Answer with your voice'}
        </button>
      )}
      {state === 'error' && <span className="text-[var(--hover-color)]">Transcription failed — try again or type.</span>}
    </div>
  )
}
