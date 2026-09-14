import { useState } from 'react'
import { StaggerReveal } from './stagger-reveal/stagger-reveal'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './stagger-reveal/stagger-reveal.jsx?raw'

const FILES = [{ path: 'stagger-reveal.jsx', code: srcComponent }]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `stagger-reveal/${f.path}` })),
  `/*
 * stagger-reveal — from transitions.dev, self-contained.
 * Original: https://transitions.dev
 * Styles auto-inject on import (SSR-safe, idempotent). Changes:
 * stagger generalizes to N lines via inline transition-delay, and
 * shown is a prop — its edges drive the entrance/exit machine.
 */`,
)

const PROPS = [
  { name: 'lines', type: 'string[]', def: '—', desc: 'Any number of lines; each staggers by i * --stagger-stagger.' },
  { name: 'primary / secondary', type: 'string', def: '—', desc: 'Two-line shorthand — same as lines={[primary, secondary]}.' },
  { name: 'shown', type: 'boolean', def: 'true', desc: 'false→true plays the staggered entrance; true→false plays the quiet 200ms fade.' },
  { name: 'className / style', type: 'string / CSSProperties', def: '—', desc: 'Merged onto the group; --stagger-* vars tune the motion.' },
]

export default function StaggerRevealDoc() {
  const [shown, setShown] = useState(true)

  const snippet = `import { StaggerReveal } from './stagger-reveal/stagger-reveal'

<StaggerReveal
  shown={isVisible}
  lines={['Your order shipped', 'Arriving Thursday']}
/>

// Two states: false→true staggers the entrance, true→false fades
// out in place over 200ms — decoupled from the stagger timing.
// Tune via CSS vars: --stagger-dur, --stagger-distance,
// --stagger-stagger, --stagger-blur, --stagger-ease.`

  return (
    <article className="doc">
      <DocHeader
        title="Stagger Reveal"
        tag="transitions.dev"
        chip={`stagger-reveal/ · ${FILES.length} file · self-contained · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Lines rise, un-blur, and settle one after another — the delay holds
        each back so the eye lands on the headline first. Hiding decouples
        from the stagger: a single quiet 200ms fade, no reverse reveal.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — toggle flips between the staggered entrance and the quiet fade
          </span>
          <div className="demo-card sr-demo-card">
            <StaggerReveal
              shown={shown}
              lines={['Your order shipped', 'Arriving Thursday, May 8']}
              className="sr-demo-lines"
            />
            <StaggerReveal
              shown={shown}
              lines={['Three lines', 'stagger cleanly', 'all the way down']}
              className="sr-demo-lines sr-demo-small"
            />
          </div>
          <div className="sb-controls">
            <label>
              shown
              <select value={shown ? 'shown' : 'hidden'} onChange={(e) => setShown(e.target.value === 'shown')}>
                <option value="shown">shown</option>
                <option value="hidden">hidden</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.jsx" />

      <DocSection
        title="Source"
        desc={
          <>
            From transitions.dev — self-contained: styles auto-inject on
            import (SSR-safe, idempotent), and the motion is pure CSS
            transitions on opacity/translate/blur gated by{' '}
            <code>.is-shown</code>/<code>.is-hiding</code> on the group. The
            exit is deliberately asymmetric — a flat 200ms fade with no Y
            return, so it reads as quiet disappearance rather than a reverse
            reveal. Two changes from upstream: the stagger generalizes to any
            number of lines via inline <code>transition-delay</code>
            (upstream caps at two), and the demo button is split out —{' '}
            <code>shown</code> is a prop whose edges drive the state
            machine.
          </>
        }
      >
        <SourceBrowser root="stagger-reveal" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://transitions.dev">transitions.dev</DocFooter>
    </article>
  )
}
