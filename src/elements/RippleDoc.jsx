import { useState } from 'react'
import { Ripple } from './ripple/ripple'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Segmented } from '../components/controls.jsx'

import srcComponent from './ripple/ripple.tsx?raw'
import srcCss from './ripple/ripple.css?raw'

const FILES = [
  { path: 'ripple.tsx', code: srcComponent },
  { path: 'ripple.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `ripple/${f.path}` })),
  `/*
 * ripple — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/ripple
 * useRipple is verbatim; the bloom is a mount-flip CSS transition.
 */`,
)

const PROPS = [
  { name: 'children', type: 'ReactNode', def: '—', desc: 'Label content, rendered above the ripple layer.' },
  { name: 'onPress', type: '() => void', def: '—', desc: 'Fired on click — separate from the gesture so keyboard works too.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Blocks spawning and releases anything in flight.' },
  { name: 'max', type: 'number', def: '4', desc: 'Most simultaneous ripples; the oldest is dropped when exceeded.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last. In the port, tint is the .rp-disc background.' },
]

export default function RippleDoc() {
  const [max, setMax] = useState(4)

  const snippet = `import { Ripple, useRipple } from './ripple/ripple'

// as a button
<Ripple onPress={() => play(d)} max={${max}}>
  {d}
</Ripple>

// as a hook on any element
const { bind, ripples, fadeDuration } = useRipple({ max: ${max} })`

  return (
    <article className="doc">
      <DocHeader
        title="Ripple"
        tag="interior.dev"
        chip={`ripple/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Touch feedback from the pointer origin. The disc blooms to cover the
        element, holds while you press, then fades — keyboard (Space/Enter)
        ripples from the center.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — press anywhere on it</span>
          <div className="demo-col">
            <Ripple onPress={() => {}} max={max}>
              Tap me — pointer-origin ripple
            </Ripple>
            <div className="keypad">
              {['1', '2', '3', '4', '5', '6'].map((d) => (
                <Ripple key={d} onPress={() => {}} max={max} className="keypad-key">
                  {d}
                </Ripple>
              ))}
            </div>
          </div>
        </div>
        <div className="controls">
          <Control label="Max ripples">
            <Segmented
              options={[2, 4, 8]}
              value={max}
              onChange={setMax}
              ariaLabel="Max simultaneous ripples"
            />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useRipple</code> is verbatim:
            pointer-captured multi-touch tracking, per-ripple reach computed
            from the farthest corner, a <code>minVisible</code> hold so fast
            taps still read, and blur/visibility bail-outs. The bloom is ported
            to a mount-flip CSS transition. Exported both as a ready button and
            as a hook you can bind to any element.
          </>
        }
      >
        <SourceBrowser root="ripple" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/ripple">
        interior.dev/docs/ripple
      </DocFooter>
    </article>
  )
}
