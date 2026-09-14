import { useState } from 'react'
import { HoldToConfirm } from './hold-to-confirm/hold-to-confirm'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Segmented, Switch } from '../components/controls.jsx'

import srcComponent from './hold-to-confirm/hold-to-confirm.tsx?raw'
import srcCss from './hold-to-confirm/hold-to-confirm.css?raw'

const FILES = [
  { path: 'hold-to-confirm.tsx', code: srcComponent },
  { path: 'hold-to-confirm.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `hold-to-confirm/${f.path}` })),
  `/*
 * hold-to-confirm — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/hold-to-confirm
 * The sweep is driven by the hold loop's own clock — it can't desync.
 */`,
)

const PROPS = [
  { name: 'onConfirm', type: '() => void', def: '—', desc: 'Fires once, only when the hold reaches full duration. A click never reaches it.' },
  { name: 'children', type: 'ReactNode', def: '—', desc: "The resting label — stays the button's accessible name in every state." },
  { name: 'onAbort', type: '() => void', def: '—', desc: 'Fires the moment a hold is released early, including a stray click.' },
  { name: 'confirmLabel', type: 'string', def: '"Confirmed"', desc: 'Shown after commit and announced through a polite live region.' },
  { name: 'duration', type: 'number', def: '1800', desc: 'Milliseconds of continuous hold required. Also the number in the screen-reader hint.' },
  { name: 'resetAfter', type: 'number', def: '1600', desc: 'Milliseconds the confirmed state holds before returning to rest. 0 keeps it confirmed.' },
  { name: 'steps', type: 'number', def: '20', desc: 'Render budget — progress is sampled this many times; the sweep itself is continuous.' },
  { name: 'releaseRate', type: 'number', def: '2.5', desc: 'How many times faster progress drains than it fills. Re-pressing mid-drain resumes from what is left.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'aria-disabled rather than the attribute, so focus is never dropped mid-hold.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last — surface, radius and width are overridable.' },
]

export default function HoldToConfirmDoc() {
  const [duration, setDuration] = useState(1800)
  const [disabled, setDisabled] = useState(false)
  const [confirmed, setConfirmed] = useState(0)
  const [aborted, setAborted] = useState(0)

  const snippet = `import { HoldToConfirm } from './hold-to-confirm/hold-to-confirm'

<HoldToConfirm
  duration={${duration}}
  confirmLabel="Workspace deleted"
  onAbort={() => track('delete.abandoned')}
  onConfirm={async () => {
    await fetch('/api/workspaces/42', { method: 'DELETE' })
  }}
>
  Delete workspace
</HoldToConfirm>`

  return (
    <article className="doc">
      <DocHeader
        title="Hold to Confirm"
        tag="interior.dev"
        chip={`hold-to-confirm/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        A guard rail in front of destructive actions. Press and hold — releasing
        early cancels and nothing happens. Works with pointer, keyboard
        (Space/Enter), and Escape to bail mid-hold.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — press and hold</span>
          <HoldToConfirm
            duration={duration}
            disabled={disabled}
            confirmLabel="Workspace deleted"
            onConfirm={() => setConfirmed((n) => n + 1)}
            onAbort={() => setAborted((n) => n + 1)}
          >
            Hold to delete workspace
          </HoldToConfirm>
          <span className="stage-size-note">
            confirmed {confirmed} · abandoned {aborted}
          </span>
        </div>
        <div className="controls">
          <Control label="Hold duration">
            <Segmented
              options={[900, 1800, 3000]}
              value={duration}
              onChange={setDuration}
              ariaLabel="Hold duration (ms)"
            />
          </Control>
          <Control label="Disabled">
            <Switch checked={disabled} onChange={setDisabled} ariaLabel="Disabled" />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useHoldToConfirm</code> is
            verbatim plus one exposed value: <code>progressF</code>, the
            continuous hold progress that drives the clip-path sweep directly
            (upstream animated it in parallel, which could drift from the actual
            gesture). Releasing drains at <code>releaseRate</code>×; re-pressing
            mid-drain resumes from the remainder.
          </>
        }
      >
        <SourceBrowser root="hold-to-confirm" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/hold-to-confirm">
        interior.dev/docs/hold-to-confirm
      </DocFooter>
    </article>
  )
}
