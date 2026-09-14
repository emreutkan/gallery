import { useState } from 'react'
import { FloatingLabelInput } from './floating-label/floating-label'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Switch } from '../components/controls.jsx'

import srcComponent from './floating-label/floating-label.tsx?raw'
import srcCss from './floating-label/floating-label.css?raw'

const FILES = [
  { path: 'floating-label.tsx', code: srcComponent },
  { path: 'floating-label.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `floating-label/${f.path}` })),
  `/*
 * floating-label — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/floating-label
 * useFloatingLabel is verbatim; the label lift is a CSS transform transition.
 */`,
)

const PROPS = [
  { name: 'label', type: 'string', def: '—', desc: "The field's name. It moves into a reserved slot above the text; never swapped out for a placeholder." },
  { name: 'value', type: 'string', def: '—', desc: 'Controlled value. Omit for uncontrolled — the label still tracks the DOM node.' },
  { name: 'defaultValue', type: 'string', def: '—', desc: 'Uncontrolled start. Counted on first render so a pre-filled field never animates its label on load.' },
  { name: 'onChange', type: '(value, event) => void', def: '—', desc: 'Receives the value first — onChange={setEmail} is the whole handler.' },
  { name: 'hint', type: 'string', def: '—', desc: 'Secondary line under the field, read once via aria-describedby.' },
  { name: 'invalid', type: 'boolean', def: 'false', desc: 'Recolors border and label, sets aria-invalid. The message stays your job.' },
  { name: 'maxLength', type: 'number', def: '—', desc: 'Enables the counter; width is reserved at its largest string so digits never nudge the row.' },
  { name: 'required', type: 'boolean', def: 'false', desc: 'Native constraint + asterisk on the label (aria-hidden — the input announces it).' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Dims the field and drops focus state mid-focus.' },
  { name: 'readOnly', type: 'boolean', def: 'false', desc: 'Focusable with the label raised, but refuses edits.' },
  { name: 'type', type: 'text | email | …', def: '"text"', desc: 'Single-line types only; geometry is built around one line.' },
  { name: 'inputRef', type: 'Ref<HTMLInputElement>', def: '—', desc: 'Merged with the internal ref so form libraries can focus the field.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last on the wrapper.' },
]

export default function FloatingLabelDoc() {
  const [email, setEmail] = useState('')
  const [reference, setReference] = useState('')
  const [touched, setTouched] = useState(false)
  const [disabled, setDisabled] = useState(false)

  const bad = touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const snippet = `import { FloatingLabelInput } from './floating-label/floating-label'

<FloatingLabelInput
  label="Work email"
  type="email"
  value={email}
  onChange={setEmail}
  invalid={touched && !isEmail(email)}
  hint={bad ? 'Needs to look like name@company.com' : 'Receipts are sent here.'}
/>

<FloatingLabelInput
  label="Invoice reference"
  value={reference}
  onChange={setReference}
  maxLength={16}
  hint="Printed on the statement header."
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Floating Label"
        tag="interior.dev"
        chip={`floating-label/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        The label makes room instead of disappearing. It lifts into a reserved
        slot above the field on focus or fill — never traded for a placeholder.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — type, blur the email field</span>
          <form className="demo-col demo-form" onSubmit={(e) => e.preventDefault()}>
            <FloatingLabelInput
              label="Work email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={setEmail}
              onBlur={() => setTouched(true)}
              invalid={bad}
              disabled={disabled}
              hint={bad ? 'Needs to look like name@company.com' : 'Receipts are sent here.'}
            />
            <FloatingLabelInput
              label="Invoice reference"
              value={reference}
              onChange={setReference}
              maxLength={16}
              disabled={disabled}
              hint="Printed on the statement header."
            />
          </form>
        </div>
        <div className="controls">
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
            Adapted from interior.dev — <code>useFloatingLabel</code> is
            verbatim: it measures the DOM node itself so uncontrolled fields
            raise correctly, and a pre-filled field mounts already-raised with
            no animation. The motion spring is replaced by a 180ms CSS
            transform on the label.
          </>
        }
      >
        <SourceBrowser root="floating-label" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/floating-label">
        interior.dev/docs/floating-label
      </DocFooter>
    </article>
  )
}
