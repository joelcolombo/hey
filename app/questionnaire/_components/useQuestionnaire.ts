'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildScreens, firstUnansweredScreen, questionCount, type Screen } from '@/lib/questionnaire/flow'
import type { Answer, Answers, ProjectConfig } from '@/lib/questionnaire/types'

type Phase = 'welcome' | 'flow' | 'review' | 'done'
type SaveState = 'idle' | 'saving' | 'pending'

interface Stored {
  identity: { name: string; email: string; sessionId: string } | null
  answers: Answers
  seen: string[]
  phase: Phase
  screenIndex: number
  /** Answers accepted locally but not yet confirmed saved to Notion. */
  pending: [string, Answer][]
}

export function useQuestionnaire(config: ProjectConfig) {
  const screens = useMemo(() => buildScreens(config.template), [config])
  const total = useMemo(() => questionCount(config.template), [config])
  const storageKey = `questionnaire:${config.clientSlug}:${config.projectSlug}`

  const [phase, setPhase] = useState<Phase>('welcome')
  const [screenIndex, setScreenIndex] = useState(0)
  const [identity, setIdentity] = useState<Stored['identity']>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const pendingRef = useRef<Map<string, Answer>>(new Map())
  /** In-flight flush run, shared so concurrent flush() calls coalesce onto it. */
  const flushPromiseRef = useRef<Promise<void> | null>(null)
  /** Set when flush() is called while a run is already in flight — tells that run to loop once more before resolving, so it never returns while newly queued answers are still unsent. */
  const flushAgainRef = useRef(false)

  // Restore local state on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const s = JSON.parse(raw) as Stored
      if (s.identity) {
        setIdentity(s.identity)
        setAnswers(s.answers ?? {})
        setSeen(new Set(s.seen ?? []))
        setPhase(s.phase === 'welcome' ? 'flow' : s.phase)
        setScreenIndex(Math.min(s.screenIndex ?? 0, screens.length - 1))
        pendingRef.current = new Map(s.pending ?? [])
        if (pendingRef.current.size) setSaveState('pending')
      }
    } catch {
      /* corrupt storage — start fresh */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist on every relevant change. `saveState` is included so that a
  // flush run mutating pendingRef (adding on submit, removing on success)
  // re-serializes it — pendingRef itself isn't reactive state.
  useEffect(() => {
    if (!identity) return
    const s: Stored = { identity, answers, seen: [...seen], phase, screenIndex, pending: [...pendingRef.current] }
    try {
      localStorage.setItem(storageKey, JSON.stringify(s))
    } catch {
      /* storage full/blocked — Notion still has the data */
    }
  }, [identity, answers, seen, phase, screenIndex, saveState, storageKey])

  /** One pass over the pending queue, 3 attempts each with backoff. */
  const runFlush = useCallback(async (sessionId: string) => {
    setSaveState('saving')
    for (const [questionId, answer] of [...pendingRef.current]) {
      let ok = false
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt))
        try {
          const res = await fetch('/api/questionnaire/answer', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              client: config.clientSlug, project: config.projectSlug,
              sessionId, questionId, answer,
            }),
          })
          ok = res.ok
        } catch {
          /* network error — retry */
        }
      }
      if (ok) pendingRef.current.delete(questionId)
    }
    setSaveState(pendingRef.current.size ? 'pending' : 'idle')
  }, [config])

  /**
   * Send all pending answers. Concurrent calls coalesce onto the same
   * in-flight promise — a caller that awaits flush() is guaranteed the
   * queue is drained (or exhausted its retries) by the time it resolves,
   * not just that some earlier flush happened to be running.
   */
  const flush = useCallback(async (): Promise<void> => {
    if (!identity) return
    if (flushPromiseRef.current) {
      flushAgainRef.current = true
      return flushPromiseRef.current
    }
    const sessionId = identity.sessionId
    const run = (async () => {
      do {
        flushAgainRef.current = false
        await runFlush(sessionId)
      } while (flushAgainRef.current)
    })().finally(() => {
      flushPromiseRef.current = null
    })
    flushPromiseRef.current = run
    return run
  }, [identity, runFlush])

  const start = useCallback(async (name: string, email: string, website: string) => {
    setStarting(true)
    setStartError(null)
    try {
      const res = await fetch('/api/questionnaire/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client: config.clientSlug, project: config.projectSlug, name, email, website }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { sessionId: string; answers: Answers; completed: boolean }
      const merged: Answers = { ...data.answers, ...answers } // local wins: at least as fresh
      const mergedSeen = new Set([...seen, ...Object.keys(data.answers)])
      setIdentity({ name, email, sessionId: data.sessionId })
      setAnswers(merged)
      setSeen(mergedSeen)
      if (data.completed) {
        setPhase('done')
      } else {
        const at = firstUnansweredScreen(screens, mergedSeen)
        if (at >= screens.length) setPhase('review')
        else {
          setScreenIndex(at)
          setPhase('flow')
        }
      }
    } catch {
      setStartError("Couldn't start the questionnaire. Please check your connection and try again.")
    } finally {
      setStarting(false)
    }
  }, [answers, config, screens, seen])

  const advance = useCallback(() => {
    setScreenIndex((i) => {
      if (i + 1 >= screens.length) {
        setPhase('review')
        return i
      }
      return i + 1
    })
  }, [screens.length])

  const goBack = useCallback(() => {
    if (phase === 'review') {
      setPhase('flow')
      setScreenIndex(screens.length - 1)
      return
    }
    setScreenIndex((i) => Math.max(0, i - 1))
  }, [phase, screens.length])

  const submitAnswer = useCallback((questionId: string, answer: Answer | null) => {
    setSeen((prev) => new Set(prev).add(questionId))
    if (answer) {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
      pendingRef.current.set(questionId, answer)
      void flush()
    }
    advance()
  }, [advance, flush])

  const goToQuestion = useCallback((questionId: string) => {
    const at = screens.findIndex((s) => s.kind === 'question' && s.question.id === questionId)
    if (at >= 0) {
      setScreenIndex(at)
      setPhase('flow')
    }
  }, [screens])

  const toReview = useCallback(() => setPhase('review'), [])

  // Retry answers left pending from a previous session (e.g. saves that
  // failed all 3 attempts before an unload) once identity is available.
  useEffect(() => {
    if (identity && pendingRef.current.size > 0) void flush()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity])

  const complete = useCallback(async () => {
    await flush()
    if (pendingRef.current.size > 0) {
      // Best effort: one more pass. Proceed regardless so the user isn't
      // stuck — the row stays "In progress" server-side if this still fails.
      await flush()
    }
    try {
      await fetch('/api/questionnaire/answer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client: config.clientSlug, project: config.projectSlug,
          sessionId: identity?.sessionId, complete: true,
        }),
      })
    } catch {
      /* row stays In progress; answers are already saved */
    }
    setPhase('done')
  }, [config, flush, identity])

  return {
    phase, screens, screenIndex,
    current: phase === 'flow' ? screens[screenIndex] ?? null : null,
    identity, answers, saveState, starting, startError,
    progress: { answered: seen.size, total },
    start, advance, goBack, submitAnswer, goToQuestion, toReview, complete,
  }
}

export type Questionnaire = ReturnType<typeof useQuestionnaire>
