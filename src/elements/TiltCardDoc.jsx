import { useState } from 'react'
import { TiltCard } from './tilt-card/tilt-card'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './tilt-card/tilt-card.jsx?raw'

const FILES = [{ path: 'tilt-card.jsx', code: srcComponent }]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `tilt-card/${f.path}` })),
  `/*
 * tilt-card — from transitions.dev, self-contained.
 * Original: https://transitions.dev
 * Styles auto-inject on import (SSR-safe, idempotent). The only change
 * is className/style passthrough on the outer wrapper.
 */`,
)

const PROPS = [
  { name: 'children', type: 'ReactNode', def: '—', desc: 'Card content; the glare layer is appended on top.' },
  { name: 'max', type: 'number', def: '32', desc: 'Peak tilt in degrees at the card edge.' },
  { name: 'className / style', type: 'string / CSSProperties', def: '—', desc: 'Merged onto the flat hit-area wrapper.' },
]

export default function TiltCardDoc() {
  const [max, setMax] = useState(32)

  const snippet = `import { TiltCard } from './tilt-card/tilt-card'

<TiltCard max={32}>
  <div className="card-face">…</div>
</TiltCard>

// Pointer is tracked on the OUTER wrapper (which never transforms),
// so the tilting card can't pull its edges out from under the cursor.
// Tune via CSS vars: --tilt-perspective, --tilt-return, --tilt-follow,
// --tilt-glare-*.`

  return (
    <article className="doc">
      <DocHeader
        title="Tilt Card"
        tag="transitions.dev"
        chip={`tilt-card/ · ${FILES.length} file · self-contained · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Hover tilt with a cursor-tracked glare — the card follows the pointer
        1:1 while moving (short linear follow), then eases back to flat over
        a full second on leave. Works on touch: tap-hold-drag tilts instead
        of scrolling.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — hover and drag across the card
          </span>
          <div className="demo-card tc-demo-card">
            <TiltCard max={max} className="tc-demo-tilt">
              <div className="tc-demo-face">
                <span className="tc-demo-title">Aurora Pass</span>
                <span className="tc-demo-sub">Season 2026</span>
                <span className="tc-demo-tag">MEMBER</span>
              </div>
            </TiltCard>
          </div>
          <div className="sb-controls">
            <label>
              max tilt
              <select value={String(max)} onChange={(e) => setMax(Number(e.target.value))}>
                <option value="12">12°</option>
                <option value="32">32°</option>
                <option value="48">48°</option>
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
            From transitions.dev — verbatim except{' '}
            <code>className</code>/<code>style</code> passthrough. The trick
            is the two-element split: the pointer is tracked on the outer{' '}
            <code>.t-tilt</code> (which never transforms), so the tilting card
            can't yank its own edges out from under the cursor. While moving,
            <code>.is-tilting</code> swaps the 1s return ease for a 400ms
            follow so the tilt tracks 1:1; on leave it eases back to flat.
            The glare is three layered radial gradients in screen blend,
            positioned by <code>--tilt-gx</code>/<code>--tilt-gy</code>.
          </>
        }
      >
        <SourceBrowser root="tilt-card" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://transitions.dev">transitions.dev</DocFooter>
    </article>
  )
}
