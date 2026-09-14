import { useState } from 'react'
import { Liquid } from './gooey/index'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcIndex from './gooey/index.ts?raw'
import srcGooey from './gooey/Gooey.tsx?raw'
import srcGooeyItem from './gooey/GooeyItem.tsx?raw'
import srcLiquidItem from './gooey/LiquidItem.tsx?raw'
import srcContext from './gooey/context.ts?raw'
import srcFilter from './gooey/filter.tsx?raw'
import srcGeometry from './gooey/geometry.ts?raw'
import srcHooks from './gooey/hooks.ts?raw'
import srcImageMelt from './gooey/imageMelt.tsx?raw'
import srcObserver from './gooey/observer.ts?raw'
import srcShadow from './gooey/shadow.ts?raw'
import srcSpring from './gooey/spring.ts?raw'

const FILES = [
  { path: 'index.ts', code: srcIndex },
  { path: 'Gooey.tsx', code: srcGooey },
  { path: 'LiquidItem.tsx', code: srcLiquidItem },
  { path: 'GooeyItem.tsx', code: srcGooeyItem },
  { path: 'filter.tsx', code: srcFilter },
  { path: 'observer.ts', code: srcObserver },
  { path: 'spring.ts', code: srcSpring },
  { path: 'geometry.ts', code: srcGeometry },
  { path: 'imageMelt.tsx', code: srcImageMelt },
  { path: 'context.ts', code: srcContext },
  { path: 'shadow.ts', code: srcShadow },
  { path: 'hooks.ts', code: srcHooks },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `gooey/${f.path}` })),
  `/*
 * gooey — liquid-gooey 0.2.1 by Jakub Antalik, MIT.
 * Original: https://libraries.dev/gooey.html
 * Vendored verbatim — the whole package source, no npm install.
 * import { Liquid } from './gooey'  (Liquid === Gooey + .Item)
 */`,
)

const LIQUID_PROPS = [
  { name: 'blur', type: 'number', def: '6', desc: 'Goo softness — the Gaussian blur before contrast re-tightens the edges.' },
  { name: 'contrast', type: 'number', def: '18', desc: 'Edge tightness — higher = snappier merge, lower = softer, more gradual bridges.' },
  { name: 'fill', type: 'CSS color', def: '"#fff"', desc: 'Silhouette paint. Should match your items\' background.' },
  { name: 'shadow', type: 'string | object', def: '—', desc: 'Box-shadow syntax painted on the merged silhouette — shadows merge with the goo too.' },
  { name: 'waviness / wavinessFreq', type: 'number', def: '0 / 0.018', desc: 'feTurbulence displacement for a boiling-liquid edge.' },
]

const ITEM_PROPS = [
  { name: 'effect', type: '"morph" | "move" | "melt" | "bend" | array', def: '"morph"', desc: 'Morph = gooey merge; move = rubber trails; melt = contact dissolve; bend = bow with velocity.' },
  { name: 'x / y / scale', type: 'number', def: '0 / 0 / 1', desc: 'Offset from the item\'s layout position — animate these to move the blob.' },
  { name: 'transition', type: '"snappy" | "smooth" | "bouncy" | spring config', def: '"smooth"', desc: 'Spring preset — simulated to a real duration, emitted as a linear() easing so CSS runs it.' },
  { name: 'delay', type: 'number (ms)', def: '0', desc: 'Stagger the move.' },
  { name: 'radius', type: 'number | [tl,tr,br,bl]', def: 'auto', desc: 'Blob corner radius; auto measures border-radius off the content.' },
]

function Icon({ d }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ACTIONS = [
  { d: 'M8 10.5V2.5M5 5.5l3-3 3 3M3 12.5h10', label: 'Share' },        // share
  { d: 'M8 3.5v7M4.5 8 8 11.5 11.5 8M3 13.5h10', label: 'Save' },     // download
  { d: 'M8 4.5a2 2 0 1 0 0 .01M13 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0z', label: 'Target' },
]

export default function GooeyDoc() {
  const [open, setOpen] = useState(false)
  const [blur, setBlur] = useState(6)
  const [contrast, setContrast] = useState(18)

  const snippet = `import { Liquid } from './gooey'

<Liquid blur={6} contrast={18} fill="#1c1917">
  <Liquid.Item x={open ? -56 : 0} y={open ? -40 : 0} transition="bouncy">
    <button className="fab sat">↗</button>
  </Liquid.Item>
  <Liquid.Item transition="bouncy">
    <button className="fab" onClick={() => setOpen(v => !v)}>+</button>
  </Liquid.Item>
</Liquid>
// Satellites move by x/y; the silhouette layer melts a bridge
// between them while they're close, then snaps apart.
// The DOM buttons stay crisp — only the painted layer goos.`

  return (
    <article className="doc">
      <DocHeader
        title="Gooey"
        tag="libraries.dev"
        chip={`gooey/ · ${FILES.length} files · vendored verbatim · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Liquid merge for DOM elements: each <code>Liquid.Item</code>{' '}
        paints a blob into a filtered SVG silhouette layer while the real
        content stays crisp on top. Items that come close melt into each
        other — the classic metaball trick, done right.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — toggle the FAB; satellites burst out on bouncy springs, melting as they separate
          </span>
          <div className="demo-card go-demo-card">
            <Liquid blur={blur} contrast={contrast} fill="#1c1917" className="go-demo-liquid">
              {ACTIONS.map((a, i) => {
                const angle = -180 + i * 45
                const rad = (angle * Math.PI) / 180
                const dist = 62
                return (
                  <Liquid.Item
                    key={a.label}
                    x={open ? Math.cos(rad) * dist : 0}
                    y={open ? Math.sin(rad) * dist : 0}
                    transition="bouncy"
                    delay={i * 30}
                    className="go-sat-wrap"
                  >
                    <button
                      type="button"
                      className="go-fab go-sat"
                      aria-label={a.label}
                      style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
                    >
                      <Icon d={a.d} />
                    </button>
                  </Liquid.Item>
                )
              })}
              <Liquid.Item transition="smooth">
                <button
                  type="button"
                  className="go-fab go-main"
                  aria-expanded={open}
                  aria-label="Actions"
                  onClick={() => setOpen((v) => !v)}
                >
                  <span className={'go-plus' + (open ? ' is-open' : '')}>+</span>
                </button>
              </Liquid.Item>
            </Liquid>
          </div>
          <div className="sb-controls">
            <label>
              blur
              <select value={blur} onChange={(e) => setBlur(Number(e.target.value))}>
                <option value={4}>4 — tight</option>
                <option value={6}>6 — default</option>
                <option value={10}>10 — runny</option>
              </select>
            </label>
            <label>
              contrast
              <select value={contrast} onChange={(e) => setContrast(Number(e.target.value))}>
                <option value={12}>12 — soft</option>
                <option value={18}>18 — default</option>
                <option value={30}>30 — snappy</option>
              </select>
            </label>
            <button type="button" className="sb-replay" onClick={() => setOpen((v) => !v)}>
              {open ? 'Close' : 'Open'}
            </button>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.jsx" />

      <DocSection
        title="Source"
        desc={
          <>
            The complete <code>liquid-gooey</code> package source (12
            files, MIT), vendored verbatim — the demo imports{' '}
            <code>./gooey</code>, not the npm package. The architecture is
            the interesting part: every item renders twice — once as real
            DOM (crisp text, real buttons) and once as a blob portaled
            into a shared SVG group filtered by{' '}
            <code>feGaussianBlur + feColorMatrix</code> alpha-contrast —
            the metaball trick. An observer engine measures each item and
            drives the blobs on springs; <code>effect="morph"</code> is the
            default, with <code>move</code>/<code>melt</code>/
            <code>bend</code> layers on top. Spring presets are simulated
            at 240Hz and emitted as <code>linear()</code> easings, so the
            browser's compositor runs real spring physics as a plain CSS
            transition.
          </>
        }
      >
        <SourceBrowser root="gooey" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Liquid props">
        <PropsTable props={LIQUID_PROPS} />
      </DocSection>

      <DocSection title="Liquid.Item props">
        <PropsTable props={ITEM_PROPS} />
      </DocSection>

      <DocFooter href="https://libraries.dev/gooey.html">libraries.dev/gooey</DocFooter>
    </article>
  )
}
