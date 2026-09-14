import { useState } from 'react'
import { PlusMenu } from './plus-menu/plus-menu'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './plus-menu/plus-menu.jsx?raw'

const FILES = [{ path: 'plus-menu.jsx', code: srcComponent }]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `plus-menu/${f.path}` })),
  `/*
 * plus-menu — from transitions.dev, self-contained.
 * Original: https://transitions.dev
 * Styles auto-inject on import (SSR-safe, idempotent). Changes:
 * open/onOpenChange added for controlled use, and the open footprint
 * became --morph-open-w / --morph-open-h so the panel sizes to its menu.
 */`,
)

const PROPS = [
  { name: 'children', type: 'ReactNode', def: '—', desc: 'Menu content rendered inside the opened panel.' },
  { name: 'open / onOpenChange', type: 'boolean / (open) => void', def: '—', desc: 'Controlled open state; uncontrolled toggles itself.' },
  { name: 'defaultOpen', type: 'boolean', def: 'false', desc: 'Initial state when uncontrolled.' },
  { name: 'className / style', type: 'string / CSSProperties', def: '—', desc: 'Merged onto the morph; size it open via --morph-open-w/--morph-open-h.' },
]

export default function PlusMenuDoc() {
  const [open, setOpen] = useState(false)

  const snippet = `import { PlusMenu } from './plus-menu/plus-menu'

// Anchor the morph in a corner sized to the OPEN footprint —
// it grows out of a fixed point.
<div className="plus-anchor">
  <PlusMenu>
    <button>New file</button>
    <button>New folder</button>
    <button>Import…</button>
  </PlusMenu>
</div>

// data-open drives the morph; CSS animates size + radius and
// cross-fades plus ↔ menu. Outside click / Escape close.`

  return (
    <article className="doc">
      <DocHeader
        title="Plus Menu"
        tag="transitions.dev"
        chip={`plus-menu/ · ${FILES.length} file · self-contained · no npm install`}
        copyAll={ALL_SOURCE}
      >
        A circular plus button that morphs into a menu panel — size and
        corner radius animate with a bouncier ease on open than on close,
        while the plus rotates into an × and slides out as the menu slides
        in. Outside click or Escape closes it.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — the + morphs open; Esc or outside click closes
          </span>
          <div className="demo-card pm-demo-card">
            <div className="pm-anchor">
              <PlusMenu
                open={open}
                onOpenChange={setOpen}
                className="pm-demo-morph"
              >
                <div className="pm-menu">
                  <span className="pm-menu-title">Create</span>
                  <button type="button" className="pm-item" onClick={() => setOpen(false)}>New file</button>
                  <button type="button" className="pm-item" onClick={() => setOpen(false)}>New folder</button>
                  <button type="button" className="pm-item" onClick={() => setOpen(false)}>Import…</button>
                </div>
              </PlusMenu>
            </div>
          </div>
          <div className="sb-controls">
            <label>
              open
              <select value={open ? 'open' : 'closed'} onChange={(e) => setOpen(e.target.value === 'open')}>
                <option value="closed">closed</option>
                <option value="open">open</option>
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
            From transitions.dev — near-verbatim. One{' '}
            <code>data-open</code> attribute drives the whole morph: width,
            height, and <code>border-radius</code> transition with a bouncier
            ease on open than close, the plus fades/slides out while its
            glyph rotates into an ×, and the menu cross-fades in slid +
            scaled + blurred. Outside click and Escape close it. Two
            additions: <code>open</code>/<code>onOpenChange</code> for
            controlled use, and the open footprint became{' '}
            <code>--morph-open-w</code>/<code>--morph-open-h</code> so the
            panel sizes to its content.
          </>
        }
      >
        <SourceBrowser root="plus-menu" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://transitions.dev">transitions.dev</DocFooter>
    </article>
  )
}
