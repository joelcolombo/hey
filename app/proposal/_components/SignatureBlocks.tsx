function Field({ label, grow }: { label: string; grow: number }) {
  return (
    <span className="flex items-baseline gap-2 min-w-0" style={{ flexGrow: grow, flexBasis: 0 }}>
      <span className="whitespace-nowrap">{label}</span>
      <span className="flex-1 border-b border-[var(--hover-color)] h-[1em]" />
    </span>
  )
}

function SignatureRow({ party }: { party: string }) {
  return (
    <div className="proposal-sig-block mb-12">
      <p className="font-medium mb-8">{party}</p>
      <div className="proposal-sig-row flex gap-8 max-md:flex-col max-md:gap-6 text-[0.95em] text-[var(--hover-color)]">
        <Field label="Signature" grow={3.4} />
        <Field label="Name" grow={3.4} />
        <Field label="Date" grow={1.2} />
      </div>
    </div>
  )
}

export default function SignatureBlocks({ clientName }: { clientName: string }) {
  return (
    <div className="proposal-section proposal-signatures hidden print:block max-w-3xl mx-auto px-6 pb-24">
      <SignatureRow party="Joel Colombo" />
      <SignatureRow party={clientName} />
    </div>
  )
}
