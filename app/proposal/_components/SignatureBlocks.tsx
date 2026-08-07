function SignatureRow({ party }: { party: string }) {
  return (
    <div className="mb-12">
      <p className="font-medium mb-8">{party}</p>
      <div className="flex gap-8 max-md:flex-col text-[0.95em] text-[var(--hover-color)]">
        <span className="flex-[2] border-b border-[var(--hover-color)] pb-1">Signature</span>
        <span className="flex-[2] border-b border-[var(--hover-color)] pb-1">Name</span>
        <span className="flex-1 border-b border-[var(--hover-color)] pb-1">Date</span>
      </div>
    </div>
  )
}

export default function SignatureBlocks({ clientName }: { clientName: string }) {
  return (
    <div className="proposal-section max-w-3xl mx-auto px-6 pb-24">
      <SignatureRow party="Joel Colombo" />
      <SignatureRow party={clientName} />
    </div>
  )
}
