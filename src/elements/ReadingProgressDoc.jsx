import { useRef } from 'react'
import { ReadingProgress } from './reading-progress/reading-progress'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './reading-progress/reading-progress.tsx?raw'
import srcCss from './reading-progress/reading-progress.css?raw'

const FILES = [
  { path: 'reading-progress.tsx', code: srcComponent },
  { path: 'reading-progress.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `reading-progress/${f.path}` })),
  `/*
 * reading-progress — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/reading-progress
 * useReadingProgress is verbatim; fill spring, readout crossfade and the
 * check draw are CSS / SVG pathLength.
 */`,
)

const STORY = [
  'The house had been empty for eleven years before anyone thought to measure it. The surveyor arrived on a Tuesday with a folding rule and a notebook, and left in the dark with neither of them full.',
  'What he found first was that none of the rooms agreed with the plan. The kitchen was a foot short in one direction and a foot long in the other, as though the walls had been shuffled overnight and had settled back almost, but not quite, where they began.',
  'He drew the discrepancy twice, then a third time, and the third drawing was the one he kept. It showed the stair landing sitting half a step above where the drawing said it should, which is a small thing on paper and a very large thing underfoot.',
  "In the front room the light came in low and stayed low, sliding across the boards all afternoon without ever reaching the far wall. He wrote that down too, because a room that never fills is a room somebody will keep leaving.",
  "By four o'clock the rule had stopped being useful. The remaining questions were about height and weight and the way a floor answers a footstep, and none of those are questions a rule can be pointed at.",
  'He locked the door behind him and stood on the path for a while, working out how long it would take to put right. The number he arrived at was longer than anyone had asked for and shorter than the house deserved.',
]

const WORDS = STORY.join(' ').split(/\s+/).length

const PROPS = [
  { name: 'target', type: '{ current: HTMLElement | null }', def: '—', desc: 'The article element. Progress runs from its top edge to its last visible line — headers and footers outside it never count.' },
  { name: 'scroller', type: '{ current: HTMLElement | null }', def: 'window', desc: 'The scroll container when the article lives in a pane. Omit for window scrolling.' },
  { name: 'steps', type: 'number', def: '24', desc: 'Scroll quantization — the max renders a full scroll can cost. The fill still reads as continuous.' },
  { name: 'words', type: 'number', def: '0', desc: 'Word count of the article. Above zero the readout shows minutes remaining; at zero the track is the percentage.' },
  { name: 'wordsPerMinute', type: 'number', def: '220', desc: 'Reading rate for the estimate.' },
  { name: 'label', type: 'string', def: '"Reading progress"', desc: 'Accessible name of the progressbar.' },
  { name: 'doneLabel', type: 'string', def: '"End"', desc: 'Replaces the estimate once the last cell lights.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last — height, gap and color are overridable.' },
]

export default function ReadingProgressDoc() {
  const scroller = useRef(null)
  const article = useRef(null)

  const snippet = `import { ReadingProgress } from './reading-progress/reading-progress'

const scroller = useRef(null)
const article = useRef(null)

<div ref={scroller} className="rp-pane">
  <header className="rp-bar">
    <ReadingProgress
      target={article}
      scroller={scroller}
      words={${WORDS}}
      steps={24}
    />
  </header>
  <article ref={article}>{body}</article>
</div>`

  return (
    <article className="doc">
      <DocHeader
        title="Reading Progress"
        tag="interior.dev"
        chip={`reading-progress/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        How much is left. The track quantizes scroll into cells so a long page
        costs at most 24 renders, and the estimate crossfades to a check when
        the last line arrives.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — scroll the story inside the pane</span>
          <div className="rp-pane" ref={scroller}>
            <header className="rp-bar">
              <ReadingProgress
                target={article}
                scroller={scroller}
                words={WORDS}
                steps={24}
              />
            </header>
            <article ref={article} className="rp-article">
              {STORY.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </article>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useReadingProgress</code> is
            verbatim: scroll is read through a rAF-throttled listener, a
            ResizeObserver keeps the ratio honest when the pane or article
            resizes, and everything quantizes to <code>steps</code> cells.
            The fill smooths between cells with a CSS transition, and the
            completion check draws via the SVG <code>pathLength</code>{' '}
            attribute — no motion package.
          </>
        }
      >
        <SourceBrowser root="reading-progress" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/reading-progress">
        interior.dev/docs/reading-progress
      </DocFooter>
    </article>
  )
}
