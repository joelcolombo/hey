import ThemeToggle from '@/components/ThemeToggle'
import './synthesis.css'
import * as d from './data'
import { Bars, Body, Card, Chips, Lede, Muted, Note, Quote, Rule, Section, Slider, Sliders, Sub, Tally, WordScale } from './primitives'

export const meta = {
  title: 'Brand Discovery: Synthesis',
  client: 'PRO',
}

export default function ProDiscoverySynthesisPage({ launchpadHref }: { launchpadHref?: string }) {
  return (
    <main className="pb-32">
      {launchpadHref && (
        <a
          href={launchpadHref}
          className="fixed top-4 left-5 z-[70] bg-[var(--background)] border border-[var(--hairline)] rounded-full px-2.5 py-0.5 label text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors print:hidden"
        >
          Launchpad
        </a>
      )}

      <div className="fixed bottom-4 left-5 z-50 print:hidden">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <p className="label text-[var(--hover-color)] mb-5">PRO</p>
        <h1 className="font-light text-[4.2em] leading-[1.02] max-md:text-[2.4em] max-w-4xl text-balance">
          Brand Discovery
        </h1>
      </header>

      {/* 01 Ten things */}
      <Section id="ten" title="Summary" intro="Start here: the whole discovery in ten points.">
        <ol className="flex flex-col gap-12 max-w-2xl">
          {d.tenThings.map((t, i) => (
            <li key={i} className="flex gap-5">
              <span className="syn-num w-12 flex-none">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="text-[1.15em] leading-[1.35] font-medium mb-3 text-pretty">{t.lede}</p>
                <p className="text-[1em] leading-[1.55] syn-muted text-pretty">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* 02 Foundation */}
      <Section id="foundation" title="Strategic foundation" intro="Purpose, message, audiences, misreadings and constraints.">
        <Sub>Purpose: full convergence</Sub>
        <Lede>
          All descriptions share one skeleton: <strong className="font-medium">cost-effective, proven, life-saving, urgent funding gap, connect implementers with philanthropy</strong>. PRO is a market intermediary, a broker, a bridge. Not a funder, not a pure evaluator.
        </Lede>
        <div className="grid md:grid-cols-3 gap-8">
          {d.purposeQuotes.map((q) => <Quote key={q.text} text={q.text} compact />)}
        </div>
        <Note>Implication: the visual metaphor should lean on connection and conduit more than on the "charity" or "think tank" archetypes.</Note>

        <Sub>What people must understand</Sub>
        <ul className="grid md:grid-cols-2 gap-x-10 gap-y-8">
          {d.keyMessages.map((m) => (
            <li key={m.lede} className="border-t border-[var(--hairline)] pt-5">
              <p className="font-medium text-[1.05em] mb-3">{m.lede}</p>
              <p className="text-[0.95em] leading-[1.5] syn-muted">{m.body}</p>
            </li>
          ))}
        </ul>

        <Sub>Audiences</Sub>
        <ul className="flex flex-col">
          {d.audiences.map((a, i) => (
            <li key={a.tier} className="grid md:grid-cols-12 gap-x-6 gap-y-2 border-t border-[var(--hairline)] last:border-b py-5">
              <div className="md:col-span-3 flex items-baseline gap-3">
                <span className={`font-light leading-none ${i === 0 ? 'text-[2.2em]' : i === 1 ? 'text-[1.6em]' : 'text-[1.2em] text-[var(--hover-color)]'}`}>{a.tier}</span>
              </div>
              <p className={`md:col-span-5 leading-[1.5] ${i === 0 ? 'text-[1.1em]' : 'text-[1em]'}`}>{a.who} <Muted>({a.by})</Muted></p>
              <p className="md:col-span-4 text-[0.95em] leading-[1.5] syn-muted">{a.implication}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10"><Quote text={d.needleQuote.text} who={d.needleQuote.who} /></div>

        <Sub>What people get wrong about PRO today</Sub>
        <ul className="grid md:grid-cols-2 gap-6">
          {d.misreadings.map((m) => (
            <li key={m.myth}>
              <Card className="h-full">
                <p className="label text-[var(--hover-color)] mb-3">They think</p>
                <p className="text-[1.05em] leading-[1.4] mb-4 syn-muted line-through decoration-1">{m.myth}</p>
                <p className="label text-[var(--hover-color)] mb-3">Actually</p>
                <p className="text-[1.05em] leading-[1.4]">{m.reality}</p>
              </Card>
            </li>
          ))}
        </ul>

        <Sub>Constraints to respect</Sub>
        <ul className="grid md:grid-cols-2 gap-x-10 gap-y-8">
          {d.constraints.map((c) => (
            <li key={c.lede} className="border-t border-[var(--hairline)] pt-5">
              <p className="font-medium text-[1.05em] mb-3">{c.lede}</p>
              <p className="text-[0.95em] leading-[1.5] syn-muted">{c.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 03 Personality */}
      <Section id="personality" title="Personality and voice" intro="Who PRO is as a person, how it speaks, and where the team wants it to move.">
        <Sub>Character words, by how many people used them</Sub>
        <Bars rows={d.characterWords} total={d.TOTAL} />
        <Note>Read: the center of gravity is the rigorous pragmatist, a competent, honest expert who moves fast and doesn’t moralize. "Inspiring" is an aspiration more than a current trait.</Note>

        <Sub>Voice</Sub>
        <ul className="flex flex-col">
          {d.voiceWords.map((v) => (
            <li key={v.word} className="grid md:grid-cols-12 gap-x-6 border-t border-[var(--hairline)] last:border-b py-3">
              <span className="md:col-span-5 text-[1.05em]">{v.word}</span>
              <span className="md:col-span-7 text-[0.95em] syn-muted">{v.note}</span>
            </li>
          ))}
        </ul>
        <Note>Today the voice is precise and caveated. The shared wish is to add warmth and inspiration without losing precision: room for one expressive, human element inside a disciplined system.</Note>

        <Sub>Personality sliders: today and future</Sub>
        <p className="syn-legend text-[0.9em] syn-muted mb-4">
          <span><i /> Today (average)</span>
          <span><i className="on" /> Future (average)</span>
          <span><i className="range" /> Range of future answers</span>
        </p>
        <Sliders>
          {d.sliders.map((s) => <Slider key={s.left} {...s} />)}
        </Sliders>
        <p className="text-[1.05em] leading-[1.6] mt-10 max-w-2xl text-pretty">
          <strong className="font-medium">The moves the team wants:</strong> more established, closer to DIV, more thought-leader, a slightly calmer urgency. While staying data-driven, global and progressive.
        </p>

        <Sub>Traits to avoid</Sub>
        <Chips items={d.avoidTraits} tone="strike" />
      </Section>

      {/* 04 DIV */}
      <Section id="div" title="Relationship with The DIV Fund" intro="Related, with a personality of its own. Closer than today, but never merged.">
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-10">
          <div>
            <Sub>When someone sees both brands</Sub>
            <Tally rows={d.kinshipVotes} total={d.TOTAL} />
          </div>
          <div>
            <Sub>Typography</Sub>
            <Tally rows={d.typographyVotes} total={d.TOTAL} />
          </div>
        </div>
        <Sub>Nuances worth holding</Sub>
        <ul className="flex flex-col gap-3">
          {d.divNuances.map((n) => (
            <li key={n} className="text-[1.05em] leading-[1.55] pl-6 relative before:content-['–'] before:absolute before:left-0 before:syn-muted text-pretty">{n}</li>
          ))}
        </ul>
        <div className="mt-10">
          <Card>
            <p className="label text-[var(--hover-color)] mb-3">Working hypothesis</p>
            <p className="text-[1.15em] leading-[1.5] text-pretty">{d.divHypothesis}</p>
          </Card>
        </div>
      </Section>

      {/* 05 Legacy */}
      <Section id="legacy" title="Legacy and transition" intro="Evolution, never a fresh start. The only equity worth debating is the green.">
        <Sub>What to do with the current identity</Sub>
        <Tally rows={d.legacyVotes} total={d.TOTAL} />
        <Sub>The green question</Sub>
        <div className="grid md:grid-cols-3 gap-6">
          {d.greenPositions.map((g) => (
            <Card key={g.position} className="flex flex-col">
              <p className="text-[1.2em] font-medium mb-1">{g.position}</p>
              <p className="label text-[var(--hover-color)] mb-4">{g.who}</p>
              <ul className="flex flex-col gap-3 mt-auto">
                {g.quotes.map((q) => <li key={q} className="text-[0.95em] leading-[1.5] syn-muted">"{q}"</li>)}
              </ul>
            </Card>
          ))}
        </div>
        <Note>The green is already used in donor comms and Word docs as a low-effort visual cue. And what people may actually remember is the website and clicking through the list, not the logo.</Note>

        <Sub>The story the new identity should tell</Sub>
        <ul className="flex flex-col">
          {d.storyLines.map((s) => (
            <li key={s} className="border-t border-[var(--hairline)] last:border-b py-4">
              <span className="text-[1.2em] leading-[1.35] font-light">“{s}”</span>
            </li>
          ))}
        </ul>
        <Sub>How long-time stakeholders should feel</Sub>
        <Body>{d.stakeholderFeel}</Body>
      </Section>

      {/* 06 Visual */}
      <Section id="visual" title="Visual direction" intro="Feel, palette, imagery, metaphors, clichés to avoid, references, vocabulary.">
        <Sub>How the visual language should feel</Sub>
        <Bars rows={d.visualFeel} total={d.TOTAL} />
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          {d.vibrancyQuotes.map((q) => <Quote key={q.text} text={q.text} compact />)}
        </div>

        <Sub>Palette mood</Sub>
        <WordScale rows={d.paletteMood} max={4} />
        <Note>Colors to avoid: anything that looks like GiveWell (3 mentions), Coefficient Giving, Founders Pledge or Charity Navigator. Nobody named a specific hue.</Note>

        <Sub>Imagery</Sub>
        <ul className="flex flex-col">
          {d.imagery.map((im) => (
            <li key={im.theme} className="grid md:grid-cols-12 gap-x-6 gap-y-1 border-t border-[var(--hairline)] last:border-b py-4">
              <span className="md:col-span-5 text-[1.05em] font-medium leading-[1.35]">{im.theme}</span>
              <span className="md:col-span-7 text-[0.95em] leading-[1.5] syn-muted">{im.detail}</span>
            </li>
          ))}
        </ul>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-10 mt-14">
          <div>
            <Sub>Metaphors and themes</Sub>
            <Bars rows={d.metaphors} total={d.TOTAL} />
          </div>
          <div>
            <Sub>System: unified or modular</Sub>
            <Tally rows={d.systemVotes} total={d.TOTAL} />
            <Note>Read: a tight core (type, color, list component) with a small set of controlled variations. Not a sprawling modular toolkit.</Note>
          </div>
        </div>

        <Sub>Clichés and identities to avoid</Sub>
        <ul className="flex flex-col">
          {d.cliches.map((c) => (
            <li key={c} className="border-t border-[var(--hairline)] last:border-b py-3">
              <span className="text-[1.05em] leading-[1.4]">{c}</span>
            </li>
          ))}
        </ul>

        <Sub>References and admired organizations</Sub>
        <ul className="grid md:grid-cols-3 gap-5">
          {d.references.map((r) => (
            <li key={r.names[0].label}>
              <Card className="h-full">
                <p className="text-[1.1em] font-medium leading-[1.4] mb-3">
                  {r.names.map((n, i) => (
                    <span key={n.label}>
                      {i > 0 && <span className="syn-muted">, </span>}
                      {n.url ? (
                        <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--hover-color)] transition-colors whitespace-nowrap">
                          {n.label} <span className="label text-[var(--hover-color)]" aria-hidden>↗</span>
                          <span className="sr-only">(external link)</span>
                        </a>
                      ) : n.label}
                    </span>
                  ))}
                  {r.mentions && <span className="label text-[var(--hover-color)] ml-2 align-middle whitespace-nowrap">{r.mentions}</span>}
                </p>
                <p className="text-[0.95em] leading-[1.5] syn-muted">{r.why}</p>
              </Card>
            </li>
          ))}
        </ul>
        <Note>Pattern: the admired set is clear, honest, understated, values-led, transparency-first. Nobody cites a flashy or highly illustrated brand.</Note>

        <Sub>Key vocabulary</Sub>
        <WordScale rows={d.vocabulary} max={7} />
        <ul className="mt-10 flex flex-col gap-3">
          {d.vocabularyNotes.map((n) => <li key={n} className="text-[0.95em] leading-[1.5] syn-muted pl-6 relative before:content-['–'] before:absolute before:left-0">{n}</li>)}
        </ul>
      </Section>

      {/* 07 Success */}
      <Section id="success" title="What success looks like">
        <ul className="grid md:grid-cols-2 gap-x-10 gap-y-8">
          {d.success.map((s) => (
            <li key={s.lede} className="border-t border-[var(--hairline)] pt-5">
              <p className="font-medium text-[1.05em] mb-3">{s.lede}</p>
              <p className="text-[0.95em] leading-[1.5] syn-muted">{s.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 08 Map */}
      <Section id="map" title="Convergence map" intro="Left: safe to build on. Right: needs a call.">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-[0.95em] leading-[1.5] min-w-[40rem]">
            <thead>
              <tr className="border-b border-[var(--foreground)]">
                <th className="label text-[var(--hover-color)] font-normal py-3 pr-5 w-[18%]">Topic</th>
                <th className="label text-[var(--hover-color)] font-normal py-3 pr-5 w-[41%]">Convergence</th>
                <th className="label text-[var(--hover-color)] font-normal py-3 w-[41%]">Divergence</th>
              </tr>
            </thead>
            <tbody>
              {d.convergence.map((c) => (
                <tr key={c.topic} className="border-b border-[var(--hairline)] align-top">
                  <td className="py-3 pr-5 font-medium">{c.topic}</td>
                  <td className="py-3 pr-5">{c.agree}</td>
                  <td className="py-3 text-[var(--hover-color)]">{c.split}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 09 Tensions */}
      <Section id="tensions" title="Open tensions" intro="Seven calls to make before or while moodboarding.">
        <ol className="grid md:grid-cols-2 gap-6">
          {d.tensions.map((t, i) => (
            <li key={t.title}>
              <Card className="h-full">
                <span className="syn-num block mb-4">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[1.15em] font-medium leading-[1.3] mb-3">{t.title}</p>
                <p className="text-[0.95em] leading-[1.55] syn-muted text-pretty">{t.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* 10 Brief */}
      <Section id="brief" title="Moodboard brief" intro="Directional inputs for the boards. Color swatches are illustrative, not proposals.">
        <Sub>Brand in a sentence</Sub>
        <p className="font-light text-[1.9em] leading-[1.25] max-md:text-[1.4em] text-balance mb-4">{d.brandSentence}</p>

        <Sub>Keywords to design to</Sub>
        <div className="flex flex-col gap-5">
          <div><p className="label text-[var(--hover-color)] mb-2">Core</p><Chips items={d.keywords.core} /></div>
          <div><p className="label text-[var(--hover-color)] mb-2">Aspirational accent</p><Chips items={d.keywords.accent} tone="muted" /></div>
          <div><p className="label text-[var(--hover-color)] mb-2">Avoid</p><Chips items={d.keywords.avoid} tone="strike" /></div>
        </div>

        <Sub>Two boards to test</Sub>
        <div className="grid md:grid-cols-2 gap-6">
          {d.boards.map((b) => (
            <Card key={b.name}>
              <p className="label text-[var(--hover-color)] mb-1">{b.name}</p>
              <p className="text-[1.4em] font-light mb-4">{b.title}</p>
              <div className="syn-swatches mb-4" aria-hidden>
                {b.swatches.map((c) => <i key={c} style={{ background: c }} />)}
              </div>
              <p className="text-[0.95em] leading-[1.55] syn-muted text-pretty">{b.body}</p>
            </Card>
          ))}
        </div>
        <Note>In both: a data-viz-ready palette with 5 or 6 distinguishable categorical colors; nothing that reads as alarm or charity pink.</Note>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-10 mt-6">
          <div>
            <Sub>Typography</Sub>
            <ul className="flex flex-col gap-3">
              {d.briefNotes.typography.map((t) => <li key={t} className="text-[1.05em] leading-[1.55] pl-6 relative before:content-['–'] before:absolute before:left-0 before:syn-muted text-pretty">{t}</li>)}
            </ul>
          </div>
          <div>
            <Sub>Imagery and graphic devices</Sub>
            <ul className="flex flex-col gap-3">
              {d.briefNotes.imagery.map((t) => <li key={t} className="text-[1.05em] leading-[1.55] pl-6 relative before:content-['–'] before:absolute before:left-0 before:syn-muted text-pretty">{t}</li>)}
            </ul>
          </div>
        </div>
        <Rule />
        <Sub>Tone of the whole board</Sub>
        <p className="text-[1.25em] leading-[1.5] text-pretty">{d.briefNotes.tone}</p>
      </Section>

    </main>
  )
}
