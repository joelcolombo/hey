'use client'

import type { ProjectConfig } from '@/lib/questionnaire/types'

export default function DoneScreen({ config, name }: { config: ProjectConfig; name: string | null }) {
  const first = name?.split(' ')[0]
  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <h2 className="text-[3em] leading-[1.1] mb-6 max-md:text-[2em]">
        Thank you{first ? `, ${first}` : ''}.
      </h2>
      <p className="text-[1.2em] leading-[1.5] text-[var(--hover-color)] max-w-xl">
        Your answers are saved and will directly shape the direction of {config.clientName}&rsquo;s {config.projectTitle.toLowerCase()}.
        If anything else comes to mind, you can reopen this link and add to your answers anytime.
      </p>
    </div>
  )
}
