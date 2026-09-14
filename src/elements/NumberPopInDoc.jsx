import { useState } from 'react'
import { NumberPopIn } from './number-pop-in/number-pop-in'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './number-pop-in/number-pop-in.jsx?raw'

const FILES = [{ path: 'number-pop-in.jsx', code: srcComponent }]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `number-pop-in/${f.path}` })),
  `/*
 * number-pop-in — from transitions.dev, self-contained.
 * Original: https://transitions.dev
 * Styles auto-inject on import (SSR-safe, idempotent). The only change:
 * the stagger delay is applied per-digit inline so strings of any length
 * stagger fully — upstream CSS caps data-stagger at 2.
 */`,
)

const PROPS = [
  { name: 'value', type: 'string', def: '"123"', desc: 'The string to render — each character pops in with a blur + rise.' },
  { name: 'className / style', type: 'string / CSSProperties', def: '—', desc: 'Merged onto the digit group; --digit-* vars tune the motion.' },
]

const DIRECTIONS = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
}

export default function NumberPopInDoc() {
  const [value, setValue] = useState('1,024.99')
  const [dir, setDir] = useState('down')
  const [key, setKey] = useState(0)

  const snippet = `import { NumberPopIn } from './number-pop-in/number-pop-in'

<NumberPopIn value="1,024.99" />

// Remount to replay — or toggle .is-animating on the group.
// Tune via CSS vars: --digit-dur, --digit-distance, --digit-stagger,
// --digit-blur, --digit-dir-x / --digit-dir-y (unit-less multipliers).`

  const d = DIRECTIONS[dir]

  return (
    <article className="doc">
      <DocHeader
        title="Number Pop-in"
        tag="transitions.dev"
        chip={`number-pop-in/ · ${FILES.length} file · self-contained · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Per-digit pop-in — each character rises, un-blurs, and settles with a
        stagger. Direction is a pair of unit-less multipliers on{' '}
        <code>--digit-dir-x</code>/<code>--digit-dir-y</code>; duration,
        distance, stagger, and blur are all CSS vars.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — remount replays the stagger
          </span>
          <div className="demo-card np-demo-card">
            <NumberPopIn
              key={`${key}-${dir}`}
              value={value}
              className="np-demo-number"
              style={{ '--digit-dir-x': d.x, '--digit-dir-y': d.y }}
            />
          </div>
          <div className="sb-controls">
            <label>
              value
              <input
                className="np-demo-input"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setKey((k) => k + 1)
                }}
              />
            </label>
            <label>
              direction
              <select value={dir} onChange={(e) => setDir(e.target.value)}>
                {Object.keys(DIRECTIONS).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="cm-replay"
              onClick={() => setKey((k) => k + 1)}
            >
              replay
            </button>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.jsx" />

      <DocSection
        title="Source"
        desc={
          <>
            From transitions.dev — already self-contained: styles auto-inject
            on first import (idempotent via the element id, SSR-safe), and the
            motion is pure CSS — a keyframed translate+blur+fade per digit,
            staggered by <code>--digit-stagger</code>. Two changes from
            upstream: the demo button is split out of the component (remount
            or toggle <code>.is-animating</code> to replay — a{' '}
            <code>replayDigitGroup(el)</code> helper is exported), and the
            stagger is applied per-digit inline so strings longer than three
            characters still stagger fully.
          </>
        }
      >
        <SourceBrowser root="number-pop-in" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://transitions.dev">transitions.dev</DocFooter>
    </article>
  )
}
