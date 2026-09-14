import { useState } from 'react'
import { LikeButton } from './like-button/like-button'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './like-button/like-button.jsx?raw'

const FILES = [{ path: 'like-button.jsx', code: srcComponent }]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `like-button/${f.path}` })),
  `/*
 * like-button — from transitions.dev, self-contained.
 * Original: https://transitions.dev
 * Styles auto-inject on import (SSR-safe, idempotent). Changes:
 * liked/onLikedChange for controlled use, a children label slot,
 * className passthrough. The button's own chrome (padding, position)
 * is left to you — the injected styles cover icon, pop and burst.
 */`,
)

const PROPS = [
  { name: 'liked / onLikedChange', type: 'boolean / (liked) => void', def: '—', desc: 'Controlled liked state; uncontrolled toggles itself.' },
  { name: 'defaultLiked', type: 'boolean', def: 'false', desc: 'Initial state when uncontrolled.' },
  { name: 'children', type: 'ReactNode', def: '"Like"', desc: 'Label after the heart.' },
  { name: 'className', type: 'string', def: '—', desc: 'Merged onto the button; add your own chrome (padding, radius, position:relative for the burst).' },
]

export default function LikeButtonDoc() {
  const [liked, setLiked] = useState(false)

  const snippet = `import { LikeButton } from './like-button/like-button'

<LikeButton liked={liked} onLikedChange={setLiked} />

// The button's chrome is yours — give it position:relative (the
// burst anchors to its center) and whatever padding you want.
// Tune via CSS vars: --like-color, --like-pop, --like-particle-*.`

  return (
    <article className="doc">
      <DocHeader
        title="Like Button"
        tag="transitions.dev"
        chip={`like-button/ · ${FILES.length} file · self-contained · no npm install`}
        copyAll={ALL_SOURCE}
      >
        A heart that fills, spring-pops, and fires an 8-dot burst — each
        like re-seeds the particles' vectors, velocity, delay, and size so
        the spray never repeats. Unliking skips the burst.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — click to like; each burst is re-randomised
          </span>
          <div className="demo-card lb-demo-card">
            <LikeButton liked={liked} onLikedChange={setLiked} className="lb-demo-like">
              Like
            </LikeButton>
          </div>
          <div className="sb-controls">
            <label>
              liked
              <select value={liked ? 'liked' : 'not'} onChange={(e) => setLiked(e.target.value === 'liked')}>
                <option value="not">not liked</option>
                <option value="liked">liked</option>
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
            From transitions.dev — near-verbatim. The nice detail: the pop
            scale lives on an HTML wrapper around the heart, never the{' '}
            <code>&lt;svg&gt;</code> itself — transforming an inline SVG
            makes Chromium rasterise it at 1× (pixelated on hi-DPI), so the
            wrapper keeps the vector crisp. The burst re-seeds per-particle{' '}
            <code>--px/--py/--pdur/--pdelay/--p-end-scale/--psize</code> vars
            every like and forces a reflow so it replays. Changes:{' '}
            <code>liked</code>/<code>onLikedChange</code> for controlled
            use, a <code>children</code> label slot, and{' '}
            <code>className</code> passthrough — the button's chrome
            (padding, <code>position:relative</code>) is intentionally left
            to the caller.
          </>
        }
      >
        <SourceBrowser root="like-button" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://transitions.dev">transitions.dev</DocFooter>
    </article>
  )
}
