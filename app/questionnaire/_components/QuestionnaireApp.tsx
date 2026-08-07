'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import type { ProjectConfig } from '@/lib/questionnaire/types'
import DoneScreen from './DoneScreen'
import ProgressBar from './ProgressBar'
import QuestionScreen from './QuestionScreen'
import ReviewScreen from './ReviewScreen'
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
              onBackToReview={q.returnToReview ? q.toReview : undefined}
            />
          )}

          {q.phase === 'review' && <ReviewScreen config={config} q={q} />}

          {q.phase === 'done' && <DoneScreen config={config} name={q.identity?.name ?? null} onEdit={q.toReview} />}
        </motion.div>
      </AnimatePresence>
      {q.phase === 'flow' && <SaveIndicator state={q.saveState} />}
      {/* Identity escape hatch for shared devices: clears local state and
          returns to a fresh welcome. Mirrors SaveIndicator, bottom-right. */}
      {q.identity && q.phase !== 'welcome' && (
        <button
          onClick={q.resetIdentity}
          className="fixed bottom-4 right-5 text-[0.75em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors z-50"
        >
          Not {q.identity.name.split(' ')[0]}? Start over
        </button>
      )}
    </div>
  )
}
