import { useState } from 'react'
import { Arc } from './spinners/arc'
import { Ring } from './spinners/ring'
import { BouncingDots } from './spinners/bouncing-dots'
import { Comet } from './spinners/comet'
import { LinearDots } from './spinners/linear-dots'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcFrame from './spinners/frame.jsx?raw'
import srcArc from './spinners/arc.jsx?raw'
import srcRing from './spinners/ring.jsx?raw'
import srcBouncingDots from './spinners/bouncing-dots.jsx?raw'
import srcComet from './spinners/comet.jsx?raw'
import srcLinearDots from './spinners/linear-dots.jsx?raw'

const FILES = [
  { path: 'frame.jsx', code: srcFrame },
  { path: 'arc.jsx', code: srcArc },
  { path: 'ring.jsx', code: srcRing },
  { path: 'bouncing-dots.jsx', code: srcBouncingDots },
  { path: 'comet.jsx', code: srcComet },
  { path: 'linear-dots.jsx', code: srcLinearDots },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `spinners/${f.path}` })),
  `/*
 * spinners — from loading-dev (https://loading.dev), MIT, self-contained.
 * Ported from loading-dev 0.3.0 verbatim. Each component renders a
 * <style href precedence> tag; React 19 hoists + dedupes it, so the
 * CSS ships with the spinner — no stylesheet import needed.
 */`,
)

const PROPS = [
  { name: 'size', type: 'number', def: '20', desc: 'Dimensions in px — drives --ld-size; dot/gap/stroke sizes are all calc()d from it.' },
  { name: 'color', type: 'CSS color', def: 'currentColor', desc: 'Tint; inherits from the parent otherwise.' },
  { name: 'duration', type: 'number (ms)', def: 'per spinner', desc: 'Loop speed — Arc/Ring 800, Comet 700, Bouncing Dots 500, Linear Dots 900.' },
  { name: 'playState', type: '"running" | "paused"', def: '"running"', desc: 'Pauses the animation via --ld-play-state.' },
  { name: 'easing', type: '"linear" | "ease-in-out" | "stacked"', def: '"linear"', desc: 'Rotating spinners only (Arc, Ring, Comet). "stacked" adds a linear + eased rotation so it varies speed without stopping.' },
  { name: 'className', type: 'string', def: '—', desc: 'Merged onto the root.' },
]

const SPINNERS = [
  { name: 'Arc', Comp: Arc, rotating: true },
  { name: 'Ring', Comp: Ring, rotating: true },
  { name: 'Comet', Comp: Comet, rotating: true },
  { name: 'Bouncing Dots', Comp: BouncingDots, rotating: false },
  { name: 'Linear Dots', Comp: LinearDots, rotating: false },
]

export default function SpinnersDoc() {
  const [size, setSize] = useState(32)
  const [color, setColor] = useState('')
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)
  const [easing, setEasing] = useState('linear')

  const snippet = `import { Arc, Ring, Comet, BouncingDots, LinearDots } from './spinners'

<Arc size={20} />                    {/* single open stroke rotating */}
<Ring color="#f97316" />            {/* arc over a faint track */}
<Comet easing="stacked" />          {/* conic-gradient tail + head dot */}
<BouncingDots duration={700} />     {/* 3 dots, staggered bounce */}
<LinearDots playState="paused" />   {/* 3 dots lighting up in turn */}`

  const shared = {
    size,
    playState: paused ? 'paused' : 'running',
    ...(color ? { color } : null),
  }

  return (
    <article className="doc">
      <DocHeader
        title="Spinners"
        tag="loading.dev"
        chip={`spinners/ · ${FILES.length} files · self-contained · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Five loading.dev spinners, ported verbatim — Arc, Ring, Comet,
        Bouncing Dots, and Linear Dots. Each ships its own CSS via a
        deduped <code>&lt;style&gt;</code> tag and tunes entirely through
        CSS custom properties.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — all controls drive CSS vars on the root; nothing re-renders but the style attr
          </span>
          <div className="demo-card sp-demo-row">
            {SPINNERS.map(({ name, Comp, rotating }) => (
              <div className="sp-demo-cell" key={name}>
                <Comp
                  {...shared}
                  duration={undefined}
                  easing={rotating ? easing : undefined}
                  style={{ '--ld-duration': `${Math.round(800 / speed)}ms` }}
                />
                <span>{name}</span>
              </div>
            ))}
          </div>
          <div className="sb-controls">
            <label>
              size
              <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
                <option value={16}>16</option>
                <option value={24}>24</option>
                <option value={32}>32</option>
                <option value={48}>48</option>
              </select>
            </label>
            <label>
              color
              <select value={color} onChange={(e) => setColor(e.target.value)}>
                <option value="">inherit</option>
                <option value="#f97316">orange</option>
                <option value="#2563eb">blue</option>
                <option value="#dc2626">red</option>
              </select>
            </label>
            <label>
              speed
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </label>
            <label>
              easing
              <select value={easing} onChange={(e) => setEasing(e.target.value)}>
                <option value="linear">linear</option>
                <option value="ease-in-out">ease-in-out</option>
                <option value="stacked">stacked</option>
              </select>
            </label>
            <label>
              state
              <select value={paused ? 'paused' : 'running'} onChange={(e) => setPaused(e.target.value === 'paused')}>
                <option value="running">running</option>
                <option value="paused">paused</option>
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
            Verbatim from loading-dev 0.3.0 (MIT) — the package is only
            six small files, vendored here so the demo imports the local
            source, not the npm package. The mechanism worth stealing:
            each spinner renders a{' '}
            <code>&lt;style href=&quot;ld-name&quot; precedence&gt;</code>{' '}
            tag — React 19 hoists it to the head and dedupes it by href,
            so a hundred spinners ship one stylesheet. All tuning flows
            through three CSS vars on the root (
            <code>--ld-size</code>, <code>--ld-duration</code>,{' '}
            <code>--ld-play-state</code>) plus <code>currentColor</code>;
            the dot spinners phase their loops with negative
            animation-delays so the wave is already mid-cycle on mount.
            One porting change: <code>spinnerRoot</code> now forwards
            extra DOM attributes (upstream dropped them).
          </>
        }
      >
        <SourceBrowser root="spinners" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props — all five spinners">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://loading.dev">loading.dev</DocFooter>
    </article>
  )
}
