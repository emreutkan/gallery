import { useState } from 'react'
import { LogoMarquee } from './logo-marquee/logo-marquee'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './logo-marquee/logo-marquee.tsx?raw'
import srcCss from './logo-marquee/logo-marquee.css?raw'

const FILES = [
  { path: 'logo-marquee.tsx', code: srcComponent },
  { path: 'logo-marquee.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `logo-marquee/${f.path}` })),
  `/*
 * logo-marquee — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/logo-marquee
 * Drift loop / fold-wrap / focus nudge-settle verbatim; only
 * useReducedMotion and useIsomorphicLayoutEffect were swapped local.
 */`,
)

const S = { width: 14, height: 14, display: 'block' }

const CUSTOMERS = [
  {
    id: 'vercel',
    label: 'Vercel',
    mark: (
      <svg {...S} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M8 2 15 14H1Z" />
      </svg>
    ),
  },
  {
    id: 'github',
    label: 'GitHub',
    mark: (
      <svg {...S} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <circle cx="8" cy="8" r="7" />
      </svg>
    ),
  },
  {
    id: 'stripe',
    label: 'Stripe',
    mark: (
      <svg {...S} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <rect x="2" y="4" width="12" height="3" rx="1.5" />
        <rect x="2" y="9" width="8" height="3" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'linear',
    label: 'Linear',
    mark: (
      <svg {...S} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    id: 'raycast',
    label: 'Raycast',
    mark: (
      <svg {...S} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M8 1 15 8 8 15 1 8Z" />
      </svg>
    ),
  },
  {
    id: 'framer',
    label: 'Framer',
    mark: (
      <svg {...S} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M3 1h10v4.6H8.3L13 10H8.3v5L3 10V1Z" />
      </svg>
    ),
  },
]

const PROPS = [
  { name: 'items', type: 'LogoMarqueeItem[]', def: '—', desc: 'Each { id, label, href?, mark? }. mark is the artwork; label is what SRs get.' },
  { name: 'label', type: 'string', def: '"Logos"', desc: 'Accessible name for the region — announced as one landmark.' },
  { name: 'speed', type: 'number', def: '44', desc: 'px/sec, time-based — a 120Hz display does not run twice as fast.' },
  { name: 'direction', type: '"left" | "right"', def: '"left"', desc: 'Drift direction. Both share the wrap window, so neither shows a seam.' },
  { name: 'gap', type: 'number', def: '40', desc: 'Px between logos and between repeats — the seam spacing matches.' },
  { name: 'paused', type: 'boolean', def: 'false', desc: 'Controlled stop, ORed with hover/focus. Clears ramp back up in place.' },
  { name: 'onSelect', type: '(item) => void', def: '—', desc: 'Renders each logo as a button instead of a link.' },
  { name: 'onPauseChange', type: '(paused: boolean) => void', def: '—', desc: 'Once per drift↔held transition, never per frame.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last on the section.' },
]

export default function LogoMarqueeDoc() {
  const [direction, setDirection] = useState('left')
  const [paused, setPaused] = useState(false)

  const snippet = `import { LogoMarquee } from './logo-marquee/logo-marquee'

<LogoMarquee
  items={CUSTOMERS}      // { id, label, href?, mark? }
  label="Customers"
  speed={38}
  gap={44}
  direction="left"
  onSelect={(item) => openCaseStudy(item)}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Logo Marquee"
        tag="interior.dev"
        chip={`logo-marquee/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Stops when you look at it. The strip drifts on a time-based rAF loop
        that wraps seamlessly; hover, press or focus eases it to a stop
        instead of snapping, and tabbing to a logo nudges it into view first.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — hover or tab to a logo; it settles, not snaps
          </span>
          <div className="demo-form" style={{ width: 'min(560px, 100%)' }}>
            <p className="lm-demo-kicker">Trusted by</p>
            <LogoMarquee
              items={CUSTOMERS}
              label="Customers"
              speed={38}
              gap={44}
              direction={direction}
              paused={paused}
              onSelect={() => {}}
            />
            <div className="demo-card-acts" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className={`demo-chip${direction === 'right' ? ' on' : ''}`}
                onClick={() =>
                  setDirection((d) => (d === 'left' ? 'right' : 'left'))
                }
              >
                → right
              </button>
              <button
                type="button"
                className={`demo-chip${paused ? ' on' : ''}`}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? 'Resume' : 'Pause'}
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
            Adapted from interior.dev — the whole drift engine is verbatim:
            a time-based rAF loop that exponentially ramps speed in and out
            (<code>RAMP</code>), folds the offset into one loop-width window
            so the seam is invisible, and settles a <code>nudge</code> so a
            focused logo slides fully into view before stopping. Copies are
            measured with <code>ResizeObserver</code>, capped at 14, and
            every repeat is <code>aria-hidden</code> except one live group.
            Under reduced motion it renders a single still, scrollable
            strip. <code>onPauseChange</code> — documented upstream but
            unwired there — is implemented.
          </>
        }
      >
        <SourceBrowser root="logo-marquee" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/logo-marquee">
        interior.dev/docs/logo-marquee
      </DocFooter>
    </article>
  )
}
