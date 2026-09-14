import { useState } from 'react'
import { CopyButton as InteriorCopyButton } from './copy-button/copy-button'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Segmented } from '../components/controls.jsx'

import srcComponent from './copy-button/copy-button.tsx?raw'
import srcCss from './copy-button/copy-button.css?raw'

const FILES = [
  { path: 'copy-button.tsx', code: srcComponent },
  { path: 'copy-button.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `copy-button/${f.path}` })),
  `/*
 * copy-button — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/copy-button
 * motion + Tailwind replaced by CSS transitions; the clipboard hook is verbatim.
 */`,
)

const PROPS = [
  { name: 'value', type: 'string', def: '—', desc: 'The text written to the clipboard.' },
  { name: 'label', type: 'string', def: '"Copy"', desc: "Resting label — also the button's accessible name." },
  { name: 'copiedLabel', type: 'string', def: '"Copied"', desc: 'Shown while the success state is held.' },
  { name: 'errorLabel', type: 'string', def: '"Failed"', desc: 'Shown when the write fails.' },
  { name: 'timeout', type: 'number', def: '2000', desc: 'Milliseconds before the state reverts to idle.' },
  { name: 'onCopy', type: '(value) => void', def: '—', desc: 'Fires after a successful write.' },
  { name: 'onError', type: '(reason) => void', def: '—', desc: 'Fires when both clipboard paths fail.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Native disabled — the button never enters a busy state.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last — surface, radius and type are overridable.' },
]

export default function CopyButtonDoc() {
  const [timeout, setTimeout_] = useState(2000)

  const snippet = `import { CopyButton } from './copy-button/copy-button'

<CopyButton
  value="sk_live_DEMO_4eC39HqLyjWDarj"
  label="Copy key"
  timeout={${timeout}}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Copy Button"
        tag="interior.dev"
        chip={`copy-button/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Copy to tick, width locked, reverts after 2s. The label stack keeps the
        button the same width in every state; the check mark draws itself on.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — click it</span>
          <InteriorCopyButton
            value="sk_live_DEMO_4eC39HqLyjWDarj"
            label="Copy key"
            timeout={timeout}
          />
        </div>
        <div className="controls">
          <Control label="Revert after">
            <Segmented
              options={[1000, 2000, 4000]}
              value={timeout}
              onChange={setTimeout_}
              ariaLabel="Revert timeout"
            />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useCopyToClipboard</code> is
            verbatim (async clipboard API with an execCommand fallback); the
            view layer is ported from motion springs to CSS transitions. Copy a
            file, or take both — no build step, no packages.
          </>
        }
      >
        <SourceBrowser root="copy-button" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="In context" desc="Inside an API-key row — the width stays locked through the state change.">
        <div className="demo-row">
          <div className="demo-card">
            <div className="demo-card-label">settings · api keys</div>
            <div className="keyrow">
              <code className="keyrow-token">sk_live_DEMO_4eC39HqLyjWDarj</code>
              <InteriorCopyButton
                value="sk_live_DEMO_4eC39HqLyjWDarj"
                label="Copy key"
                timeout={timeout}
              />
            </div>
          </div>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/copy-button">
        interior.dev/docs/copy-button
      </DocFooter>
    </article>
  )
}
