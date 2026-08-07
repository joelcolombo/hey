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
  const unmountedRef = useRef(false)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const stopTracks = (stream?: MediaStream) => {
    const s = stream || recorderRef.current?.stream
    s?.getTracks().forEach((t) => t.stop())
  }

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
      stopTracks()
      window.clearInterval(tickRef.current)
      abortRef.current?.abort()
    }
  }, [])

  if (!available) return null

  const start = async () => {
    if (startingRef.current) return
    startingRef.current = true

    let stream: MediaStream | undefined
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      recorderRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      rec.onstop = () => {
        if (unmountedRef.current) return
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
      stream?.getTracks().forEach((t) => t.stop())
      setState('denied')
    } finally {
      startingRef.current = false
    }
  }

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const transcribe = async (blob: Blob) => {
    if (unmountedRef.current) return
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
      if (unmountedRef.current) return
      if (data.text.trim()) onTranscriptRef.current(data.text.trim())
      setState('idle')
    } catch (err) {
      if (unmountedRef.current || abort.signal.aborted) return
      setState('error')
    }
  }

  if (state === 'denied')
    return <p className="text-[0.85em] text-[var(--hover-color)]">Microphone blocked. You can keep typing.</p>

  // Styled after formform's VoiceNoteRecorder states verbatim (ink→foreground,
  // paper→background, hairline→hover-color).

  // Recording: inverted pill, pinging dot, live timer against the cap.
  if (state === 'recording')
    return (
      <button
        type="button"
        onClick={stop}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] text-[var(--background)] border border-[var(--foreground)] px-2.5 py-0.5 label"
      >
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--background)] opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--background)]" />
        </span>
        <span className="tabular-nums">
          {fmt(elapsed)} / {fmt(MAX_SECONDS)}
        </span>
        <span>· Stop recording</span>
      </button>
    )

  // Idle / transcribing: dot pill + helper line.
  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={() => void start()}
        disabled={state === 'transcribing'}
        className="inline-flex items-center gap-2 border border-[var(--hover-color)] rounded-full px-2.5 py-0.5 label text-[var(--foreground)] opacity-80 hover:opacity-100 hover:border-[var(--foreground)] transition-colors disabled:opacity-40"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--foreground)] opacity-70" aria-hidden />
        <span>{state === 'transcribing' ? 'Transcribing…' : 'Answer with your voice'}</span>
      </button>
      <p className="label text-[0.625rem] text-[var(--hover-color)]">
        Prefer talking? Skip the typing and answer with a voice note of up to 3&rsquo;
      </p>
      {state === 'error' && (
        <p className="label text-[0.625rem] text-[var(--hover-color)]" role="alert">
          Transcription failed. Try again or type.
        </p>
      )}
    </div>
  )
}
