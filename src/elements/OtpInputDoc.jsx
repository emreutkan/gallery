import { useRef, useState } from 'react'
import { OtpInput } from './otp-input/otp-input'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './otp-input/otp-input.tsx?raw'
import srcCss from './otp-input/otp-input.css?raw'

const FILES = [
  { path: 'otp-input.tsx', code: srcComponent },
  { path: 'otp-input.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `otp-input/${f.path}` })),
  `/*
 * otp-input — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/otp-input
 * useOtpInput is verbatim; shake, char pop, caret and message swap are CSS.
 */`,
)

const PROPS = [
  { name: 'length', type: 'number', def: '6', desc: 'Number of cells. The group reserves its full width on first paint.' },
  { name: 'mode', type: '"numeric" | "alphanumeric"', def: '"numeric"', desc: 'Which characters survive typing and pasting. Sets inputMode so phones open the right keyboard.' },
  { name: 'defaultValue', type: 'string', def: '""', desc: 'Seed characters, filtered by mode and truncated to length. Cells own the value after mount.' },
  { name: 'onChange', type: '(value) => void', def: '—', desc: 'Every accepted edit, including a paste that fills several cells at once.' },
  { name: 'onComplete', type: '(value) => void', def: '—', desc: 'Fires the moment every cell holds a character, and again on later edits of a full code.' },
  { name: 'status', type: '"idle" | "error" | "success"', def: '"idle"', desc: 'Error marks every cell aria-invalid and shakes once on entry. The characters are kept.' },
  { name: 'errorMessage', type: 'string', def: '""', desc: 'Shown in the status line and announced once through a polite live region.' },
  { name: 'successMessage', type: 'string', def: '""', desc: 'Status line when status is "success".' },
  { name: 'hint', type: 'string', def: '""', desc: 'Occupies the same grid cell as the error message — they never move each other.' },
  { name: 'label', type: 'string', def: '"Verification code"', desc: 'Names the group and each cell, as "character 3 of 6".' },
  { name: 'groupEvery', type: 'number', def: '3', desc: 'Extra gap inserted before every nth cell.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Disables every cell and drops the focus indicator.' },
  { name: 'autoFocus', type: 'boolean', def: 'false', desc: 'Focuses the first cell after mount rather than during render.' },
  { name: 'focusOnError', type: 'boolean', def: 'true', desc: 'On rejection, returns focus to the first cell with its character selected so retyping overwrites.' },
  { name: 'ref', type: 'Ref<OtpInputHandle>', def: '—', desc: 'Imperative { clear, focus } for resetting after success.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last on the outer wrapper.' },
]

export default function OtpInputDoc() {
  const [phase, setPhase] = useState('idle') // idle | checking | rejected | ok
  const timer = useRef(null)

  const status =
    phase === 'rejected' ? 'error' : phase === 'ok' ? 'success' : 'idle'

  function submit(code) {
    setPhase('checking')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setPhase(code === '204815' ? 'ok' : 'rejected')
    }, 650)
  }

  const snippet = `import { OtpInput } from './otp-input/otp-input'

<OtpInput
  length={6}
  autoFocus
  disabled={phase === 'checking'}
  status={phase === 'rejected' ? 'error' : phase === 'ok' ? 'success' : 'idle'}
  errorMessage="That code is wrong. Fix the digit that slipped."
  successMessage="Verified — you're in."
  hint="Try 204815, or paste anything into a cell."
  onChange={() => setPhase((p) => (p === 'rejected' || p === 'ok' ? 'idle' : p))}
  onComplete={submit}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="OTP Input"
        tag="interior.dev"
        chip={`otp-input/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Auto advance, paste, error recovery. Six real inputs dressed as cells —
        arrows, Home/End, Backspace and paste all behave the way muscle memory
        expects. Wrong codes shake once and hand focus back to cell one.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — the code is 204815; paste works in any cell
          </span>
          <OtpInput
            length={6}
            autoFocus
            disabled={phase === 'checking'}
            status={status}
            errorMessage="That code is wrong. Fix the digit that slipped."
            successMessage="Verified — you're in."
            hint={
              phase === 'checking'
                ? 'Checking…'
                : 'Try 204815, or anything else.'
            }
            onChange={() =>
              setPhase((p) => (p === 'rejected' || p === 'ok' ? 'idle' : p))
            }
            onComplete={submit}
          />
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useOtpInput</code> is verbatim:
            it owns the character array, filters input by mode, routes paste
            across cells, and moves focus on every key that should. The
            visible character layer is decoupled from the transparent inputs,
            so each glyph can pop in with a blur while the real input keeps
            owning selection and the keyboard. Shake, caret blink, and the
            status-line swap are CSS.
          </>
        }
      >
        <SourceBrowser root="otp-input" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/otp-input">
        interior.dev/docs/otp-input
      </DocFooter>
    </article>
  )
}
