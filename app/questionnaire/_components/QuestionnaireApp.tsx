'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import type { ProjectConfig } from '@/lib/questionnaire/types'
import DoneScreen from './DoneScreen'
import IndexOverlay from './IndexOverlay'
import ProgressBar from './ProgressBar'
import QuestionScreen from './QuestionScreen'
import ReviewScreen from './ReviewScreen'
import SaveIndicator from './SaveIndicator'
import SectionInterlude from './SectionInterlude'
import WelcomeScreen from './WelcomeScreen'
import { useQuestionnaire } from './useQuestionnaire'

export default function QuestionnaireApp({ config }: { config: ProjectConfig }) {
  const q = useQuestionnaire(config)
  const [showIndex, setShowIndex] = useState(false)

  // Arrow-key navigation between screens. Ignored while focus is inside a
  // text field — otherwise moving the cursor in a multi-line answer would
  // navigate away and discard the un-submitted draft — and while the index
  // overlay is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (q.phase !== 'flow') return
      if (document.getElementById('q-index-overlay')) return
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

  // Position-based hairline: how far into the questionnaire the current
  // screen sits (review/done = full).
  const fraction =
    q.phase === 'review' || q.phase === 'done'
      ? 1
      : q.current?.kind === 'question'
        ? (q.current.number - 1) / Math.max(q.progress.total, 1)
        : q.screenIndex / Math.max(q.screens.length, 1)

  return (
    <div className="w-full">
      {q.phase === 'flow' && <ProgressBar fraction={fraction} />}
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
            <SectionInterlude
              section={q.current.section}
              sectionIndex={q.current.sectionIndex}
              totalSections={config.template.sections.length}
              onContinue={q.advance}
            />
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
      {/* Question index: jump anywhere without walking the flow. Button
          mirrors the voice pill (sans dot). */}
      {(q.phase === 'flow' || q.phase === 'review') && q.identity && (
        <button
          onClick={() => setShowIndex(true)}
          className="fixed top-4 left-5 border border-[var(--hover-color)] rounded-full px-2.5 py-0.5 label text-[var(--foreground)] opacity-80 hover:opacity-100 hover:border-[var(--foreground)] transition-colors z-50"
        >
          Index
        </button>
      )}
      <AnimatePresence>
        {showIndex && (
          <IndexOverlay
            config={config}
            answers={q.answers}
            seen={q.seen}
            currentId={q.current?.kind === 'question' ? q.current.question.id : null}
            onNavigate={(id) => {
              q.goToQuestion(id)
              setShowIndex(false)
            }}
            onClose={() => setShowIndex(false)}
          />
        )}
      </AnimatePresence>

      {/* Same theme control as the site footer, bottom-left. */}
      <div className="fixed bottom-4 left-5 z-50">
        <ThemeToggle />
      </div>

      {/* Bottom-right cluster: autosave status + identity escape hatch for
          shared devices (clears local state, back to a fresh welcome). */}
      <div className="fixed bottom-4 right-5 z-50 flex items-center gap-4">
        {q.phase === 'flow' && <SaveIndicator state={q.saveState} />}
        {q.identity && q.phase !== 'welcome' && (
          <button
            onClick={q.resetIdentity}
            className="text-[0.75em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors"
          >
            Not {q.identity.name.split(' ')[0]}? Start over
          </button>
        )}
      </div>
    </div>
  )
}
