import { useEffect, useRef, useState } from 'react'
import { SkeletonSwap } from './skeleton-swap/skeleton-swap'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './skeleton-swap/skeleton-swap.tsx?raw'
import srcCss from './skeleton-swap/skeleton-swap.css?raw'

const FILES = [
  { path: 'skeleton-swap.tsx', code: srcComponent },
  { path: 'skeleton-swap.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `skeleton-swap/${f.path}` })),
  `/*
 * skeleton-swap — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/skeleton-swap
 * useSkeletonSwap is verbatim; the swap crossfade is CSS.
 */`,
)

const BIO =
  'Ships the last twenty percent. Writes about the half-second after a click, and about the three things that always go missing before a component is actually done.'

const PROPS = [
  { name: 'ready', type: 'boolean', def: '—', desc: 'Flips to true when the real content is available. Everything else is timing around this one value.' },
  { name: 'children', type: 'ReactNode', def: '—', desc: 'The real content. Mount it once the data exists; the box is held either way.' },
  { name: 'lines', type: 'number', def: '3', desc: 'How many text lines the skeleton draws, and how much height it reserves.' },
  { name: 'lineHeight', type: 'number', def: '21', desc: 'Pixel line height of the content it stands in for. Match the text leading and the reserve is exact.' },
  { name: 'barHeight', type: 'number', def: '9', desc: 'Height of the bar inside each reserved line. Visual only — does not change the reserve.' },
  { name: 'reserve', type: 'number', def: 'lines × lineHeight', desc: 'Explicit box height in px for non-text content: media, charts, fixed cards.' },
  { name: 'delay', type: 'number', def: '120', desc: 'Ms of silence before the skeleton may paint. A response faster than this never shows one.' },
  { name: 'minVisible', type: 'number', def: '380', desc: 'Once painted, the skeleton stays at least this long — it cannot blink.' },
  { name: 'label', type: 'string', def: '—', desc: 'Names the region and announces "<label> loaded" once. Omit for silence apart from aria-busy.' },
  { name: 'skeleton', type: 'ReactNode', def: '—', desc: 'Replaces the default bars with your own placeholder shape. Pair with reserve.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last, so callers win.' },
]

export default function SkeletonSwapDoc() {
  const [bio, setBio] = useState(null)
  const timer = useRef(null)

  const reload = () => {
    clearTimeout(timer.current)
    setBio(null)
    timer.current = setTimeout(() => setBio(BIO), 1100)
  }

  useEffect(() => {
    reload()
    return () => clearTimeout(timer.current)
  }, [])

  const snippet = `import { SkeletonSwap } from './skeleton-swap/skeleton-swap'

<SkeletonSwap
  ready={bio !== null}
  lines={3}
  lineHeight={21}
  label="Profile"
>
  {bio ? <p>{bio}</p> : null}
</SkeletonSwap>`

  return (
    <article className="doc">
      <DocHeader
        title="Skeleton Swap"
        tag="interior.dev"
        chip={`skeleton-swap/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Skeleton to content with zero layout shift. The box is reserved at the
        content&rsquo;s real height, fast responses skip the skeleton entirely,
        and once shown it can&rsquo;t blink out early.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — replays the fetch (~1.1s)</span>
          <article className="demo-card">
            <h3 className="demo-card-title">Priya Raman</h3>
            <SkeletonSwap
              ready={bio !== null}
              lines={3}
              lineHeight={21}
              label="Profile"
              className="demo-card-body"
            >
              {bio ? <p className="demo-card-text">{bio}</p> : null}
            </SkeletonSwap>
            <footer className="demo-card-foot">Member since 2019</footer>
          </article>
        </div>
        <div className="controls">
          <button type="button" className="demo-submit" onClick={reload}>
            Replay
          </button>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useSkeletonSwap</code> is
            verbatim: <code>delay</code> suppresses skeletons for fast
            responses, <code>minVisible</code> keeps a shown one from
            blinking, and a ResizeObserver flips tabIndex on when the box
            overflows. The swap itself is a CSS crossfade — content unblurs
            in while the bones fade out of the same grid cell, so the box
            never moves.
          </>
        }
      >
        <SourceBrowser root="skeleton-swap" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/skeleton-swap">
        interior.dev/docs/skeleton-swap
      </DocFooter>
    </article>
  )
}
