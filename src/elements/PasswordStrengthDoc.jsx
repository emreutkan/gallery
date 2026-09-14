import { useState } from 'react'
import {
  PasswordStrength,
  PasswordInfo,
  usePasswordStrength,
} from './password-strength/password-strength'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './password-strength/password-strength.tsx?raw'
import srcCss from './password-strength/password-strength.css?raw'

const FILES = [
  { path: 'password-strength.tsx', code: srcComponent },
  { path: 'password-strength.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `password-strength/${f.path}` })),
  `/*
 * password-strength — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/password-strength
 * usePasswordStrength is verbatim; springs replaced with CSS transitions.
 * PasswordInfo adds the in-field (i) requirements popover.
 */`,
)

const PROPS = [
  { name: 'value', type: 'string', def: '—', desc: 'The password being typed. Controlled — keeps no copy of the secret.' },
  { name: 'rules', type: 'readonly PasswordRule[]', def: 'defaultPasswordRules', desc: 'The requirement set. Its length is the segment count — five rules draw five cells.' },
  { name: 'labels', type: 'readonly string[]', def: 'Empty…Strong', desc: 'One label per score from 0 to rules.length. All share one grid cell, so the widest sets width once.' },
  { name: 'announceDelay', type: 'number', def: '700', desc: 'Ms of quiet before the live region speaks. The visible meter is never delayed.' },
  { name: 'showRules', type: 'boolean', def: 'true', desc: 'Renders the checklist under the meter. Off when rules live in a PasswordInfo popover.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last, so caller spacing/width wins.' },
  { name: 'PasswordInfo', type: '{ value, rules?, className? }', def: '—', desc: 'The (i) button for inside the field — requirements popover on hover/focus, checks off live.' },
  { name: 'usePasswordStrength', type: '(value, opts) => state', def: '—', desc: 'Score, label, evaluated rules, guessable flag, and the delayed announcement — without the chrome.' },
]

export default function PasswordStrengthDoc() {
  const [password, setPassword] = useState('')
  const { score, max } = usePasswordStrength(password)

  const snippet = `import {
  PasswordStrength,
  PasswordInfo,
  usePasswordStrength,
} from './password-strength/password-strength'

const { score, max } = usePasswordStrength(password)

<label className="demo-label" htmlFor="pw">New password</label>
<div className="ps-field">
  <input
    id="pw"
    type="password"
    className="ps-input"
    value={password}
    autoComplete="new-password"
    onChange={(e) => setPassword(e.target.value)}
  />
  <PasswordInfo value={password} />
</div>

<PasswordStrength value={password} showRules={false} />

<button disabled={score < max}>Create account</button>`

  return (
    <article className="doc">
      <DocHeader
        title="Password Strength"
        tag="interior.dev"
        chip={`password-strength/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Strength read segment by segment. The requirements checklist lives
        behind an (i) button inside the field — hover or tab to it and every
        rule checks off live. Common patterns get flagged as guessed.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — type, then hover the (i) in the field</span>
          <form className="demo-col demo-form" onSubmit={(e) => e.preventDefault()}>
            <label className="demo-label" htmlFor="pw-demo">
              New password
            </label>
            <div className="ps-field">
              <input
                id="pw-demo"
                type="password"
                className="ps-input"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordInfo value={password} />
            </div>
            <PasswordStrength value={password} showRules={false} />
            <button type="submit" className="demo-submit" disabled={score < max}>
              Create account
            </button>
          </form>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>usePasswordStrength</code> is
            verbatim: sequential patterns, repeated characters, and common
            passwords pin the score to Weak no matter what the rules say, and
            the aria-live announcement waits for a pause in typing. The
            requirement list is extracted into <code>RuleList</code> so{' '}
            <code>PasswordInfo</code> can show the same checklist in the
            field&rsquo;s popover while the meter runs with{' '}
            <code>showRules=&#123;false&#125;</code>.
          </>
        }
      >
        <SourceBrowser root="password-strength" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/password-strength">
        interior.dev/docs/password-strength
      </DocFooter>
    </article>
  )
}
