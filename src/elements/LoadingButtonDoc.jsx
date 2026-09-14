import { useState } from 'react'
import { LoadingButton } from './loading-button/loading-button'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Segmented } from '../components/controls.jsx'

import srcComponent from './loading-button/loading-button.tsx?raw'
import srcCss from './loading-button/loading-button.css?raw'

const FILES = [
  { path: 'loading-button.tsx', code: srcComponent },
  { path: 'loading-button.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `loading-button/${f.path}` })),
  `/*
 * loading-button — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/loading-button
 * motion + Tailwind replaced by CSS transitions; useAsyncAction is verbatim.
 */`,
)

const PROPS = [
  { name: 'onAction', type: '() => unknown', def: '—', desc: 'Runs on click. Sync throws and rejected promises settle into error; anything else settles into success.' },
  { name: 'children', type: 'string', def: '—', desc: "The idle label. A string because it also becomes the button's accessible name." },
  { name: 'pendingLabel', type: 'string', def: 'children', desc: 'Label while the action is in flight.' },
  { name: 'successLabel', type: 'string', def: '"Done"', desc: 'Label after the action resolves, shown with a check mark.' },
  { name: 'errorLabel', type: 'string', def: '"Try again"', desc: 'Label after the action rejects — make it the next action, not the diagnosis.' },
  { name: 'resetAfter', type: 'number', def: '1400', desc: 'Milliseconds the settled state is held before returning to idle.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Genuinely unavailable, as opposed to busy. Only this sets the native disabled attribute.' },
  { name: 'onError', type: '(error) => void', def: '—', desc: "Receives the rejection value. The button reports the state; reporting the error is the caller's job." },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last, so callers can override the surface, radius or type scale.' },
]

export default function LoadingButtonDoc() {
  const [outcome, setOutcome] = useState('succeed')
  const [delay, setDelay] = useState(900)

  const snippet = `import { LoadingButton } from './loading-button/loading-button'

<LoadingButton
  onAction={async () => {
    const res = await fetch('/api/releases/42/publish', { method: 'POST' })
    if (!res.ok) throw new Error(await res.text())
  }}
  pendingLabel="Publishing…"
  successLabel="Published"
  errorLabel="Retry"
  onError={(e) => console.error(e)}
>
  Publish
</LoadingButton>`

  return (
    <article className="doc">
      <DocHeader
        title="Loading Button"
        tag="interior.dev"
        chip={`loading-button/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Label to state without layout shift. All four faces share one grid cell,
        so the button never changes size between idle, pending, success and
        error.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — click it</span>
          <LoadingButton
            onAction={() =>
              new Promise((resolve, reject) =>
                setTimeout(() => (outcome === 'succeed' ? resolve() : reject(new Error('500'))), delay),
              )
            }
            pendingLabel="Publishing…"
            successLabel="Published"
            errorLabel="Retry"
            onError={(e) => console.log('onError:', e.message)}
          >
            Publish
          </LoadingButton>
        </div>
        <div className="controls">
          <Control label="Action resolves">
            <Segmented
              options={['succeed', 'fail']}
              value={outcome}
              onChange={setOutcome}
              ariaLabel="Action outcome"
            />
          </Control>
          <Control label="Delay">
            <Segmented
              options={[300, 900, 2000]}
              value={delay}
              onChange={setDelay}
              ariaLabel="Action delay (ms)"
            />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useAsyncAction</code> (idle →
            pending → success/error → auto-reset, with run-id guards against
            stale settles) is verbatim; the animated face stack is ported from
            motion springs to CSS transitions. The port also drops the
            tailwind/motion imports, so the copied files need nothing but React.
          </>
        }
      >
        <SourceBrowser root="loading-button" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/loading-button">
        interior.dev/docs/loading-button
      </DocFooter>
    </article>
  )
}
