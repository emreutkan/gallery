import { StickyHeader } from './sticky-header/sticky-header'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './sticky-header/sticky-header.tsx?raw'
import srcCss from './sticky-header/sticky-header.css?raw'

const FILES = [
  { path: 'sticky-header.tsx', code: srcComponent },
  { path: 'sticky-header.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `sticky-header/${f.path}` })),
  `/*
 * sticky-header — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/sticky-header
 * useScroll/useSpring/useTransform → a scroll listener + damped spring
 * follower writing styles imperatively. No re-renders during condense.
 */`,
)

const MAIL = [
  ['Nadia Okonkwo', 'Re: pricing page copy'],
  ['Build bot', 'main passed in 3m 12s'],
  ['Sam Ferreira', 'Invoice for October'],
  ['Design weekly', 'Notes from Thursday'],
  ['Priya Raman', 'Contract redlines attached'],
  ['Status', 'Region eu-west-1 recovered'],
  ['Tom Vale', 'Can we move standup?'],
  ['Ines Cardoso', 'Two questions about the audit'],
]

const PROPS = [
  { name: 'title', type: 'string', def: '—', desc: 'The large title, and the label the compact bar crossfades to. Reaches the a11y tree exactly once.' },
  { name: 'children', type: 'ReactNode', def: '—', desc: 'The scrollable content. Passed as a prop, so a condense step never re-renders it.' },
  { name: 'subtitle', type: 'string', def: '—', desc: 'Secondary line under the title. Out of flow — length changes never reflow.' },
  { name: 'leading', type: 'ReactNode', def: '—', desc: 'Left slot in the bar, present in every state. Interactive, unlike the rest of the header.' },
  { name: 'actions', type: 'ReactNode', def: '—', desc: 'Right slot in the bar. Fixed height, so condensing never moves it.' },
  { name: 'expandedHeight', type: 'number', def: '68', desc: 'Height reserved at rest, in px. The spacer under the header matches it from first paint.' },
  { name: 'compactHeight', type: 'number', def: '48', desc: 'Height of the condensed bar. Also the scroll-padding-top of the region.' },
  { name: 'maxHeight', type: 'number', def: '320', desc: 'Cap on the scroll region.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last to the outer panel.' },
  { name: 'useCondense', type: '({ range, onFrame })', def: '—', desc: 'Scroll→spring driver: { ref, progress, condensed }. onFrame(p) fires per frame for your own styling.' },
]

export default function StickyHeaderDoc() {
  const snippet = `import { StickyHeader } from './sticky-header/sticky-header'

<StickyHeader
  title="Inbox"
  subtitle={\`\${open} unread\`}
  maxHeight={340}
  leading={<BackButton />}
  actions={<ComposeButton />}
>
  <ul>
    {mail.map((m) => <MailRow key={m.id} mail={m} />)}
  </ul>
</StickyHeader>`

  return (
    <article className="doc">
      <DocHeader
        title="Sticky Header"
        tag="interior.dev"
        chip={`sticky-header/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Condenses as you go down. The large title drifts up and out while the
        compact title lands in the same band — a spring-smoothed scroll
        progress drives every piece, so it settles instead of snapping.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — scroll the list</span>
          <div className="demo-form" style={{ width: 'min(400px, 100%)' }}>
            <StickyHeader
              title="Inbox"
              subtitle={`${MAIL.length} messages`}
              maxHeight={340}
            >
              <ul className="mail-list">
                {MAIL.map(([from, subject]) => (
                  <li key={from} className="mail-row">
                    <span className="mail-from">{from}</span>
                    <span className="mail-subject">{subject}</span>
                  </li>
                ))}
              </ul>
            </StickyHeader>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — upstream pipes{' '}
            <code>useScroll → useTransform → useSpring</code> through
            MotionValues; here <code>useCondense</code> runs the same physics
            (stiffness 240, damping 44, mass 0.6) on a damped-spring follower
            that writes transforms imperatively each frame — no re-renders
            while condensing, and reduced motion snaps straight to the
            target.
          </>
        }
      >
        <SourceBrowser root="sticky-header" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/sticky-header">
        interior.dev/docs/sticky-header
      </DocFooter>
    </article>
  )
}
