import { useState } from 'react'
import { PollResults } from './poll-results/poll-results'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './poll-results/poll-results.tsx?raw'
import srcCss from './poll-results/poll-results.css?raw'

const FILES = [
  { path: 'poll-results.tsx', code: srcComponent },
  { path: 'poll-results.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `poll-results/${f.path}` })),
  `/*
 * poll-results — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/poll-results
 * usePollResults is verbatim; fills are per-row damped springs
 * written imperatively, the tick pop is CSS.
 */`,
)

const INITIAL = [
  { id: 'oak', label: 'Oak, oiled', votes: 54 },
  { id: 'trav', label: 'Travertine', votes: 42 },
  { id: 'brick', label: 'Painted brick', votes: 17 },
  { id: 'concrete', label: 'Concrete, sealed', votes: 9 },
]

const PROPS = [
  { name: 'options', type: 'PollOption[]', def: '—', desc: 'Choices, each { id, label, votes }. Update votes optimistically in onVote.' },
  { name: 'label', type: 'string', def: '—', desc: 'The question. Required — also the group aria-label.' },
  { name: 'value', type: 'string | null', def: '—', desc: 'Controlled choice. null = not voted; anything else reveals results.' },
  { name: 'defaultValue', type: 'string | null', def: 'null', desc: 'Uncontrolled starting choice, for a poll already answered.' },
  { name: 'onVote', type: '(id: string) => void', def: '—', desc: 'Fires once, on the first choice. Later clicks are refused — one vote.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last to the root.' },
]

export default function PollResultsDoc() {
  const [options, setOptions] = useState(INITIAL)
  const [value, setValue] = useState(null)
  const [round, setRound] = useState(0)

  const reset = () => {
    setOptions(INITIAL)
    setValue(null)
    setRound((r) => r + 1)
  }

  const snippet = `import { PollResults } from './poll-results/poll-results'

<PollResults
  label="Floor for the front room?"
  options={options}
  value={value}
  onVote={(id) => {
    setValue(id)
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, votes: o.votes + 1 } : o)),
    )
  }}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Poll Results"
        tag="interior.dev"
        chip={`poll-results/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        The winner lands last. Rows stay buttons until the first vote, then
        each fill springs to its share — the largest travels furthest, so the
        winning bar is the last to land, and its tick pops a beat after.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — pick a floor; bars spring to their shares
          </span>
          <div className="demo-card" style={{ width: 'min(420px, 100%)' }}>
            <PollResults
              key={round}
              label="Floor for the front room?"
              options={options}
              value={value}
              onVote={(id) => {
                setValue(id)
                setOptions((prev) =>
                  prev.map((o) =>
                    o.id === id ? { ...o, votes: o.votes + 1 } : o,
                  ),
                )
              }}
            />
            <div className="demo-card-acts">
              <button type="button" className="demo-chip" onClick={reset}>
                New vote
              </button>
            </div>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>usePollResults</code> is
            verbatim (controlled/uncontrolled, one vote, share + winner
            derivation). Upstream drives each fill with{' '}
            <code>animate()</code> on a MotionValue; here every row runs a
            damped spring (210 / 34 / 0.9) writing{' '}
            <code>clip-path</code> and the percent readout imperatively —
            zero re-renders while animating. The winner tick is a CSS pop;
            the vote total fades in late; a <code>role=status</code> announces
            the outcome after the bars settle.
          </>
        }
      >
        <SourceBrowser root="poll-results" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/poll-results">
        interior.dev/docs/poll-results
      </DocFooter>
    </article>
  )
}
