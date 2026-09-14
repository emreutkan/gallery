import { useState } from 'react'
import { InlineValidation } from './inline-validation/inline-validation'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Segmented } from '../components/controls.jsx'

import srcComponent from './inline-validation/inline-validation.tsx?raw'
import srcCss from './inline-validation/inline-validation.css?raw'

const FILES = [
  { path: 'inline-validation.tsx', code: srcComponent },
  { path: 'inline-validation.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `inline-validation/${f.path}` })),
  `/*
 * inline-validation — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/inline-validation
 * useInlineValidation is verbatim; icons/message crossfade are CSS.
 */`,
)

const checkEmail = (v) => {
  if (v.trim() === '') return 'A work email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'That is not a complete email address.'
  return null
}

const PROPS = [
  { name: 'label', type: 'string', def: '—', desc: 'Visible label, wired to the input with htmlFor.' },
  { name: 'value', type: 'string', def: '—', desc: 'Controlled value — the field owns no text of its own.' },
  { name: 'onChange', type: '(value) => void', def: '—', desc: 'Raw input value on every keystroke.' },
  { name: 'validate', type: '(value) => string | null', def: '—', desc: 'Pure check — return the message to show, or null when acceptable.' },
  { name: 'hint', type: 'string', def: '—', desc: 'Resting help text. Shares one grid cell with the error and crossfades out when it takes over.' },
  { name: 'debounce', type: 'number', def: '400', desc: 'Ms a still-wrong value waits before the message updates. Clearing is never debounced.' },
  { name: 'reserveLines', type: 'number', def: '1', desc: 'Lines of message space reserved up front; longer messages clamp instead of growing the field.' },
  { name: 'type', type: 'text | email | …', def: '"text"', desc: 'Native input type.' },
  { name: 'required', type: 'boolean', def: 'false', desc: 'Sets required + aria-required; the message still comes from validate.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Disables the input and dims the field.' },
  { name: 'id', type: 'string', def: '—', desc: 'Overrides the generated input id.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last to the wrapper.' },
]

export default function InlineValidationDoc() {
  const [email, setEmail] = useState('')
  const [debounce, setDebounce] = useState(400)
  const [sent, setSent] = useState(false)

  const snippet = `import { InlineValidation } from './inline-validation/inline-validation'

const checkEmail = (v) => {
  if (v.trim() === '') return 'A work email is required.'
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v)) return 'That is not a complete email address.'
  return null
}

<InlineValidation
  label="Work email"
  type="email"
  value={email}
  onChange={setEmail}
  validate={checkEmail}
  debounce={${debounce}}
  hint="Only used to send the invite."
  required
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Inline Validation"
        tag="interior.dev"
        chip={`inline-validation/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Error message that does not shove the form. Message space is reserved up
        front — the error crossfades into the hint&rsquo;s cell instead of
        pushing the form down. Blur commits; typing re-checks after the
        debounce.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — blur it empty, or type a partial email</span>
          <form
            className="demo-col demo-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!checkEmail(email)) setSent(true)
            }}
          >
            <InlineValidation
              label="Work email"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v)
                setSent(false)
              }}
              validate={checkEmail}
              debounce={debounce}
              hint="Only used to send the invite."
              autoComplete="off"
              required
            />
            <button type="submit" className="demo-submit">
              {sent ? 'Invite sent ✓' : 'Send invite'}
            </button>
          </form>
        </div>
        <div className="controls">
          <Control label="Debounce">
            <Segmented
              options={[0, 400, 900]}
              value={debounce}
              onChange={setDebounce}
              ariaLabel="Validation debounce (ms)"
            />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useInlineValidation</code> is
            verbatim: untouched fields stay silent, blur commits immediately,
            edits while invalid wait out the debounce, and clearing an error is
            never debounced. The icon pair and hint/error cell are ported from
            motion springs to CSS. The hook is exported separately for custom
            chrome.
          </>
        }
      >
        <SourceBrowser root="inline-validation" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/inline-validation">
        interior.dev/docs/inline-validation
      </DocFooter>
    </article>
  )
}
