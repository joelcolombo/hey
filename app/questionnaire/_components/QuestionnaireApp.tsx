'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import type { ProjectConfig } from '@/lib/questionnaire/types'
import ProgressBar from './ProgressBar'
import QuestionScreen from './QuestionScreen'
import SaveIndicator from './SaveIndicator'
import SectionInterlude from './SectionInterlude'
import WelcomeScreen from './WelcomeScreen'
import { useQuestionnaire } from './useQuestionnaire'

export default function QuestionnaireApp({ config }: { config: ProjectConfig }) {
  const q = useQuestionnaire(config)

  // Arrow-key navigation between screens. Ignored while focus is inside a
  // text field — otherwise moving the cursor in a multi-line answer would
  // navigate away and discard the un-submitted draft.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (q.phase !== 'flow') return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowUp') q.goBack()
      if (e.key === 'ArrowDown') q.advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [q])

  const key =
    q.phase === 'flow'
      ? `flow-${q.screenIndex}`
      : q.phase

  return (
    <div className="w-full">
      {q.phase === 'flow' && <ProgressBar answered={q.progress.answered} total={q.progress.total} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {q.phase === 'welcome' && <WelcomeScreen config={config} q={q} />}

          {q.phase === 'flow' && q.current?.kind === 'interlude' && (
            <SectionInterlude section={q.current.section} sectionIndex={q.current.sectionIndex} onContinue={q.advance} />
          )}

          {q.phase === 'flow' && q.current?.kind === 'question' && (
            <QuestionScreen
              question={q.current.question}
              section={q.current.section}
              number={q.current.number}
              total={q.progress.total}
              initial={q.answers[q.current.question.id] ?? null}
              onSubmit={(draft) => q.submitAnswer((q.current as { question: { id: string } }).question.id, draft)}
              onSkip={() => q.submitAnswer((q.current as { question: { id: string } }).question.id, null)}
            />
          )}

          {q.phase === 'review' && (
            <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
              <h2 className="text-[2.2em] mb-6">Review (full version in Task 12)</h2>
              <button onClick={() => void q.complete()}
                className="self-start border border-[var(--foreground)] rounded-full px-8 py-3">
                Submit →
              </button>
            </div>
          )}

          {q.phase === 'done' && (
            <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
              <h2 className="text-[2.2em]">Thank you.</h2>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {q.phase === 'flow' && <SaveIndicator state={q.saveState} />}
    </div>
  )
}
