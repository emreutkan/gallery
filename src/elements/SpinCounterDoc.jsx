import { useState } from 'react'
import { SpinCounter } from './spin-counter/spin-counter'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './spin-counter/spin-counter.jsx?raw'

const FILES = [{ path: 'spin-counter.jsx', code: srcComponent }]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `spin-counter/${f.path}` })),
  `/*
 * spin-counter — from transitions.dev, self-contained.
 * Original: https://transitions.dev
 * Styles auto-inject on import (SSR-safe, idempotent). Changes:
 * implements the vertical motion-blur driver upstream left out —
 * one SVG feGaussianBlur per column (stdDeviation="0 Y"), decayed
 * to 0 over each reel's staggered window. value is declarative:
 * change it and the reels spin to the new number.
 */`,
)

const PROPS = [
  { name: 'value', type: 'number', def: '0', desc: 'Target value. Change it and the reels spin (3 full turns + the digit) to land on it.' },
  { name: 'className', type: 'string', def: '—', desc: 'Merged onto the wrapper span.' },
  { name: 'style', type: 'CSSProperties', def: '—', desc: 'Inline styles on the wrapper.' },
]

const TARGETS = [42, 1284, 9007199254740991 % 10_000_000, 1000000]

export default function SpinCounterDoc() {
  const [value, setValue] = useState(4207)
  const [nonce, setNonce] = useState(0)

  const snippet = `import { SpinCounter } from './spin-counter/spin-counter'

// value is the whole API — change it, the reels spin.
<SpinCounter value={total} />

// Tune via CSS vars:
//   --reel-dur (1400ms) · --reel-stagger (90ms)
//   --reel-cell (30px) · --reel-spin-blur (3px)`

  return (
    <article className="doc">
      <DocHeader
        title="Spin Counter"
        tag="transitions.dev"
        chip={`spin-counter/ · ${FILES.length} file · self-contained · no npm install`}
        copyAll={ALL_SOURCE}
      >
        A slot-machine odometer: each digit is a clipped reel of 0–9 cells
        that translates up (3 full spins + the digit) and lands with a
        left-to-right stagger, streaked by a directional motion blur.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — set a new value; reels cascade in with a vertical streak blur
          </span>
          <div className="demo-card rc-demo-card">
            <SpinCounter key={nonce} value={value} className="rc-demo-reel" />
          </div>
          <div className="sb-controls">
            <label>
              value
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value) || 0)}
              />
            </label>
            <label>
              quick set
              <select
                defaultValue=""
                onChange={(e) => e.target.value && setValue(Number(e.target.value))}
              >
                <option value="">pick…</option>
                {TARGETS.map((t) => (
                  <option key={t} value={t}>{t.toLocaleString('en-US')}</option>
                ))}
              </select>
            </label>
            <button type="button" className="sb-replay" onClick={() => setNonce((n) => n + 1)}>
              Replay
            </button>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.jsx" />

      <DocSection
        title="Source"
        desc={
          <>
            From transitions.dev — with the piece upstream left out.
            Each column is a <code>.t-reel-col</code> clipping a strip of
            0–9 cells; the strip translates up{' '}
            <code>(spins × 10 + digit)</code> cells with a per-column
            delay, and a soft mask fades the window edges. The motion
            streak is an SVG <code>feGaussianBlur</code> with{' '}
            <code>stdDeviation="0 Y"</code> — vertical only, since CSS{' '}
            <code>blur()</code> would smear sideways — decayed to 0 over
            each reel's own window via rAF. Changes from the upstream
            snippet: the blur driver is implemented (upstream omits it
            "for brevity"), and <code>value</code> is declarative — the
            Animate button is split out so it composes like state.
          </>
        }
      >
        <SourceBrowser root="spin-counter" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://transitions.dev">transitions.dev</DocFooter>
    </article>
  )
}
