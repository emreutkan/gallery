import { useState } from 'react'
import { HideOnScroll } from './hide-on-scroll/hide-on-scroll'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './hide-on-scroll/hide-on-scroll.tsx?raw'
import srcCss from './hide-on-scroll/hide-on-scroll.css?raw'

const FILES = [
  { path: 'hide-on-scroll.tsx', code: srcComponent },
  { path: 'hide-on-scroll.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `hide-on-scroll/${f.path}` })),
  `/*
 * hide-on-scroll — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/hide-on-scroll
 * useHideOnScroll is verbatim; bar slide + hairline are CSS transitions.
 */`,
)

const STORY = [
  'A ship at sea can read its latitude off the sun. Longitude is a question about time: how far local noon has drifted from noon at a port whose position is already known.',
  'The pendulum clocks of the seventeenth century kept excellent time on land and none at all on a deck that pitched, rolled, and changed temperature twice a day.',
  'John Harrison spent thirty-one years on it. The first three machines were large, ingenious, and impractical. The fourth was the size of a pocket watch.',
  'H4 lost five seconds on the passage to Jamaica in 1761 — about a minute and a quarter of longitude, comfortably inside what the prize demanded.',
  'The Board of Longitude paid him in instalments, over fourteen years, and never in full.',
  'Within a generation the chronometer was ordinary. Ships carried three, because two that disagree tell you nothing at all.',
]

const PROPS = [
  { name: 'bar', type: 'ReactNode', def: '—', desc: 'Toolbar contents in a flex row; give the title min-w-0 flex-1 truncate so actions stay put.' },
  { name: 'children', type: 'ReactNode', def: '—', desc: 'Scrolling content. A barHeight spacer sits above it so nothing starts under the bar.' },
  { name: 'barHeight', type: 'number', def: '44', desc: 'Bar height in px — also the exact distance it travels when it yields.' },
  { name: 'hideAfter', type: 'number', def: '14', desc: 'Px of uninterrupted downward travel before the bar yields. Raise for coarse momentum.' },
  { name: 'revealAfter', type: 'number', def: '10', desc: 'Px of upward travel to bring it back — kept below hideAfter so returning is cheaper.' },
  { name: 'topGuard', type: 'number', def: '24', desc: 'Distance from top inside which the bar always shows.' },
  { name: 'pinned', type: 'boolean', def: 'false', desc: 'Forces the bar open. Set while a menu/popover/search the bar owns is on screen.' },
  { name: 'maxHeight', type: 'number', def: '320', desc: 'Cap on the scroll region.' },
  { name: 'label', type: 'string', def: '"Scrollable content"', desc: 'Accessible name for the focusable scroll region.' },
  { name: 'onHiddenChange', type: '(hidden: boolean) => void', def: '—', desc: 'Once per transition, never per frame — use it to fade a FAB in step.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last to the outer frame.' },
]

export default function HideOnScrollDoc() {
  const [pinned, setPinned] = useState(false)

  const snippet = `import { HideOnScroll } from './hide-on-scroll/hide-on-scroll'

<HideOnScroll
  label="Article"
  maxHeight={340}
  barHeight={44}
  pinned={filterOpen}
  bar={
    <>
      <span className="hs-title">Longitude</span>
      <button onClick={toggleFilter}>Filter</button>
    </>
  }
>
  {story}
</HideOnScroll>`

  return (
    <article className="doc">
      <DocHeader
        title="Hide on Scroll"
        tag="interior.dev"
        chip={`hide-on-scroll/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Toolbar yields to the content. Downward drift past a threshold slides
        it away; scrolling back up brings it home sooner than it left. Focus
        inside the bar — or anything it owns — pins it open.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — scroll down, then back up; try Pin
          </span>
          <div className="demo-form" style={{ width: 'min(420px, 100%)' }}>
            <HideOnScroll
              label="Longitude article"
              maxHeight={340}
              barHeight={44}
              pinned={pinned}
              bar={
                <>
                  <span className="hs-demo-title">Longitude</span>
                  <button
                    type="button"
                    aria-pressed={pinned}
                    onClick={() => setPinned((p) => !p)}
                    className={`hs-demo-pin${pinned ? ' on' : ''}`}
                  >
                    {pinned ? 'Pinned' : 'Pin'}
                  </button>
                </>
              }
            >
              <div className="hs-story">
                {STORY.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </HideOnScroll>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useHideOnScroll</code> is
            verbatim: scroll deltas accumulate per direction and only an
            unbroken run past the threshold flips the bar, so jitter at a
            direction change never stutters it. <code>focusWithin</code> on
            the bar pins it while anything inside holds focus. The slide and
            the hairline fade are CSS.
          </>
        }
      >
        <SourceBrowser root="hide-on-scroll" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/hide-on-scroll">
        interior.dev/docs/hide-on-scroll
      </DocFooter>
    </article>
  )
}
