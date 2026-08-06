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
  const flushingRef = useRef(false)

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
      }
    } catch {
      /* corrupt storage — start fresh */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist on every relevant change.
  useEffect(() => {
    if (!identity) return
    const s: Stored = { identity, answers, seen: [...seen], phase, screenIndex }
    try {
      localStorage.setItem(storageKey, JSON.stringify(s))
    } catch {
      /* storage full/blocked — Notion still has the data */
    }
  }, [identity, answers, seen, phase, screenIndex, storageKey])

  /** Send all pending answers, 3 attempts each with backoff. */
  const flush = useCallback(async () => {
    if (flushingRef.current || !identity) return
    flushingRef.current = true
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
              sessionId: identity.sessionId, questionId, answer,
            }),
          })
          ok = res.ok
        } catch {
          /* network error — retry */
        }
      }
      if (ok) pendingRef.current.delete(questionId)
    }
    flushingRef.current = false
    setSaveState(pendingRef.current.size ? 'pending' : 'idle')
  }, [config, identity])

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

  const complete = useCallback(async () => {
    await flush()
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
