import { useState } from 'react'
import { PressDepth } from './press-depth/press-depth'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control } from '../components/controls.jsx'

import srcComponent from './press-depth/press-depth.tsx?raw'
import srcCss from './press-depth/press-depth.css?raw'

const FILES = [
  { path: 'press-depth.tsx', code: srcComponent },
  { path: 'press-depth.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `press-depth/${f.path}` })),
  `/*
 * press-depth — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/press-depth
 * usePressDepth is verbatim; the keycap travel + lean are CSS transforms.
 */`,
)

const PROPS = [
  { name: 'children', type: 'ReactNode', def: '—', desc: 'Label content for the key face.' },
  { name: 'depth', type: 'number', def: '4', desc: 'Travel in px. The wrapper reserves it as bottom padding, so the key never changes footprint.' },
  { name: 'tilt', type: 'number', def: '7', desc: 'Max degrees the face leans toward the press origin — off-center presses dip on that side.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Blocks the gesture and releases any press already in flight.' },
  { name: 'type', type: '"button" | "submit" | "reset"', def: '"button"', desc: 'Forwarded to the underlying button so it works inside forms.' },
  { name: 'onClick', type: 'MouseEventHandler', def: '—', desc: 'Standard click — the depth is decoration, not a replacement for it.' },
  { name: 'aria-label', type: 'string', def: '—', desc: 'Accessible name when children are not text.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended to the face — surface, radius and type are overridable.' },
]

export default function PressDepthDoc() {
  const [depth, setDepth] = useState(4)
  const [tilt, setTilt] = useState(7)

  const snippet = `import { PressDepth, usePressDepth } from './press-depth/press-depth'

// as a button
<PressDepth depth={${depth}} tilt={${tilt}} onClick={() => charge()}>
  Charge
</PressDepth>

// as a hook — you own the transform
const { pressed, ref, bind } = usePressDepth()`

  return (
    <article className="doc">
      <DocHeader
        title="Press Depth"
        tag="interior.dev"
        chip={`press-depth/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        The feeling that the press landed. A keycap: the face travels down into
        a visible underside, and leans slightly toward where your finger hit.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — press near a corner</span>
          <div className="demo-row-inline">
            <PressDepth depth={depth} tilt={tilt} onClick={() => {}}>
              Press me
            </PressDepth>
            <PressDepth depth={depth} tilt={tilt} onClick={() => {}}>
              1
            </PressDepth>
            <PressDepth depth={depth} tilt={tilt} onClick={() => {}}>
              ⌫
            </PressDepth>
          </div>
          <span className="stage-size-note">
            depth {depth}px · tilt {tilt}°
          </span>
        </div>
        <div className="controls">
          <Control label="Depth">
            <div className="slider-row">
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                aria-label="Travel depth (px)"
              />
              <span className="slider-val">{depth}px</span>
            </div>
          </Control>
          <Control label="Tilt">
            <div className="slider-row">
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={tilt}
                onChange={(e) => setTilt(Number(e.target.value))}
                aria-label="Lean tilt (deg)"
              />
              <span className="slider-val">{tilt}°</span>
            </div>
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>usePressDepth</code> is verbatim:
            press origin normalized to −1..1, global pointer tracking so
            dragging off the key releases it, blur/visibility bail-outs. The
            motion springs are replaced by a CSS transform transition — the face
            still leans with <code>perspective()</code> toward the press origin.
          </>
        }
      >
        <SourceBrowser root="press-depth" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/press-depth">
        interior.dev/docs/press-depth
      </DocFooter>
    </article>
  )
}
