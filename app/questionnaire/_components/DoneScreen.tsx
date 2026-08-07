'use client'

import type { ProjectConfig } from '@/lib/questionnaire/types'

export default function DoneScreen({
  config, name, onEdit,
}: { config: ProjectConfig; name: string | null; onEdit?: () => void }) {
  const first = name?.split(' ')[0]
  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <h2 className="text-[3em] leading-[1.1] mb-6 max-md:text-[2em] text-balance">
        Thank you{first ? `, ${first}` : ''}.
      </h2>
      <p className="text-[1.2em] leading-[1.5] text-[var(--hover-color)] max-w-xl">
        Your answers are saved and will directly shape the direction of {config.clientName}&rsquo;s {config.projectTitle.toLowerCase()}.
        If anything else comes to mind, you can reopen this link and add to your answers anytime.
      </p>
      {onEdit && (
        <button onClick={onEdit}
          className="self-start mt-10 text-[0.9em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors">
          Review or add to your answers →
        </button>
      )}
    </div>
  )
}
