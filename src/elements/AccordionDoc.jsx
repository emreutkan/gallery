import { useState } from 'react'
import { Accordion } from './accordion/accordion'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Segmented } from '../components/controls.jsx'

import srcComponent from './accordion/accordion.tsx?raw'
import srcCss from './accordion/accordion.css?raw'

const FILES = [
  { path: 'accordion.tsx', code: srcComponent },
  { path: 'accordion.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `accordion/${f.path}` })),
  `/*
 * accordion — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/accordion
 * useAccordion + useAutoHeight are verbatim; disclosure is a CSS height transition.
 */`,
)

const PROPS = [
  { name: 'items', type: 'readonly AccordionItem[]', def: '—', desc: 'Rows: { id, title, content, meta? }. id must be stable — it keys the open set and the aria wiring.' },
  { name: 'type', type: '"single" | "multiple"', def: '"single"', desc: 'Whether opening a row closes its siblings or leaves them alone.' },
  { name: 'defaultOpen', type: 'readonly string[]', def: '[]', desc: 'Uncontrolled starting set. In single mode only the first id is honoured.' },
  { name: 'open', type: 'readonly string[]', def: '—', desc: 'Controlled open set — the parent becomes source of truth.' },
  { name: 'onOpenChange', type: '(open: string[]) => void', def: '—', desc: 'Fires with the next open set on every toggle, controlled or not.' },
  { name: 'collapsible', type: 'boolean', def: 'true', desc: 'In single mode, whether the open row can be clicked shut leaving nothing open.' },
  { name: 'maxPanelHeight', type: 'number', def: '220', desc: 'Panel ceiling in px — content past it scrolls inside with overscroll contained.' },
  { name: 'headingLevel', type: 'number', def: '3', desc: 'aria-level for the header wrapper, so the accordion fits the document outline.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last to the outer frame.' },
]

export default function AccordionDoc() {
  const [type, setType] = useState('single')
  const [open, setOpen] = useState(['shipping'])

  const snippet = `import { Accordion } from './accordion/accordion'

<Accordion
  type="${type}"
  open={open}
  onOpenChange={setOpen}
  maxPanelHeight={240}
  items={[
    { id: 'shipping', title: 'Shipping', meta: '3 zones', content: <p>…</p> },
    { id: 'returns',  title: 'Returns',  meta: '30 days', content: <p>…</p> },
    { id: 'sizing',   title: 'Sizing',   content: <p>…</p> },
  ]}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Accordion"
        tag="interior.dev"
        chip={`accordion/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        height: auto, done correctly. A ResizeObserver measures each panel and
        the wrapper animates between real pixel values — content can be any
        size, change while open, or scroll past a ceiling.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — arrows/Home/End move between headers
          </span>
          <div className="demo-form">
            <Accordion
              key={type}
              type={type}
              open={open}
              onOpenChange={setOpen}
              maxPanelHeight={240}
              items={[
                {
                  id: 'shipping',
                  title: 'Shipping',
                  meta: '3 zones',
                  content: (
                    <p>
                      Orders leave within two business days. Tracked in every
                      zone, signed for over $200.
                    </p>
                  ),
                },
                {
                  id: 'returns',
                  title: 'Returns',
                  meta: '30 days',
                  content: (
                    <p>
                      Anything unworn goes back within thirty days. The label
                      is in the box — the refund lands when the carrier scans
                      it.
                    </p>
                  ),
                },
                {
                  id: 'sizing',
                  title: 'Sizing',
                  content: (
                    <p>
                      Cut small. Between sizes, take the larger one — the size
                      chart on each product page is measured flat.
                    </p>
                  ),
                },
              ]}
            />
          </div>
        </div>
        <div className="controls">
          <Control label="Type">
            <Segmented
              options={['single', 'multiple']}
              value={type}
              onChange={(t) => {
                setType(t)
                setOpen(t === 'single' ? open.slice(0, 1) : open)
              }}
              ariaLabel="Accordion type"
            />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — both hooks are verbatim:{' '}
            <code>useAccordion</code> owns single/multiple state, roving
            arrow-key focus and the aria wiring; <code>useAutoHeight</code>{' '}
            measures the panel through a ResizeObserver so the collapse
            animates real pixels instead of a guessed max-height. Panels are{' '}
            <code>inert</code> while closed, so their links never take focus.
          </>
        }
      >
        <SourceBrowser root="accordion" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/accordion">
        interior.dev/docs/accordion
      </DocFooter>
    </article>
  )
}
