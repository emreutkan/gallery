import { useState } from 'react'
import { Card } from './credit-card/react'
import './credit-card/crd-ui.css'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcIndex from './credit-card/index.ts?raw'
import srcReact from './credit-card/react.tsx?raw'
import srcCard from './credit-card/card.ts?raw'
import srcBrands from './credit-card/brands.ts?raw'
import srcFormat from './credit-card/format.ts?raw'
import srcLogos from './credit-card/logos.ts?raw'
import srcCss from './credit-card/crd-ui.css?raw'

const FILES = [
  { path: 'index.ts', code: srcIndex },
  { path: 'react.tsx', code: srcReact },
  { path: 'card.ts', code: srcCard },
  { path: 'brands.ts', code: srcBrands },
  { path: 'format.ts', code: srcFormat },
  { path: 'logos.ts', code: srcLogos },
  { path: 'crd-ui.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `credit-card/${f.path}` })),
  `/*
 * credit-card — crd-ui by Juan David Garcia, MIT.
 * Original: https://crd-ui.juanda.co · github.com/JuandaGarcia/crd-ui
 * Vendored verbatim: vanilla core + React adapter + stylesheet
 * (Vue/Svelte entries omitted). No npm install:
 *   import { Card } from './credit-card/react'
 *   import './credit-card/crd-ui.css'
 */`,
)

const PROPS = [
  { name: 'number / name / expiry / cvc', type: 'string', def: '""', desc: 'Controlled values — number formats + masks per detected brand as you type.' },
  { name: 'focused', type: '"number"|"name"|"expiry"|"cvc"|null', def: 'null', desc: 'Highlights a section; "cvc" flips the card.' },
  { name: 'layout', type: '"form" | "display"', def: '"form"', desc: 'Display presents a saved card — expiry/CVC on the front, no flip, reveal by passing values.' },
  { name: 'variant', type: 'string', def: '"sunset"', desc: 'sunset · ember · holo · porcelain · graphite · gradient.' },
  { name: 'tilt', type: 'boolean', def: 'false', desc: 'Pointer-tracked 3D tilt with glare.' },
  { name: 'brand / last4', type: 'Brand | null / string', def: 'auto', desc: 'Force the brand when the number never reaches you (Stripe); show "•••• 4242" when only last4 is known.' },
  { name: 'copyable / onCopy', type: 'boolean / fn', def: 'false', desc: 'Display layout: revealed fields become click-to-copy.' },
  { name: 'classNames / placeholders / locale / logos', type: 'objects', def: '—', desc: 'Slot classes, placeholder text, label locale, custom brand SVGs.' },
]

const TEST_CARDS = [
  { brand: 'visa', number: '4111111111111111' },
  { brand: 'mastercard', number: '5555555555554444' },
  { brand: 'amex', number: '378282246310005' },
]

export default function CreditCardDoc() {
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [focused, setFocused] = useState(null)
  const [variant, setVariant] = useState('sunset')
  const [tilt, setTilt] = useState(true)
  const [brand, setBrand] = useState(null)

  const snippet = `import { Card } from './credit-card/react'
import './credit-card/crd-ui.css'

<Card
  number={number}
  name={name}
  expiry={expiry}
  cvc={cvc}
  focused={focused}   // 'cvc' flips the card
  variant="holo"
  tilt
/>

// Saved-card view: digits never needed.
<Card layout="display" copyable brand="visa" last4="4242" />`

  return (
    <article className="doc">
      <DocHeader
        title="Credit Card"
        tag="crd-ui"
        chip={`credit-card/ · ${FILES.length} files · vendored verbatim · no npm install`}
        copyAll={ALL_SOURCE}
      >
        A payment-form card preview: live brand detection for 10 brands,
        per-brand number formatting and masking, section highlighting, and
        a CVC flip — all themed through CSS custom properties.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — type in the form; focusing CVC flips the card
          </span>
          <div className="demo-card cc-demo-card">
            <Card
              number={number}
              name={name}
              expiry={expiry}
              cvc={cvc}
              focused={focused}
              variant={variant}
              tilt={tilt}
              onBrandChange={setBrand}
            />
            <div className="cc-form">
              <label className="cc-field cc-field--wide">
                <span>Card number</span>
                <input
                  value={number}
                  inputMode="numeric"
                  placeholder="•••• •••• •••• ••••"
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setFocused('number')}
                  onBlur={() => setFocused(null)}
                />
              </label>
              <label className="cc-field cc-field--wide">
                <span>Name</span>
                <input
                  value={name}
                  placeholder="Full name"
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                />
              </label>
              <label className="cc-field">
                <span>Expiry</span>
                <input
                  value={expiry}
                  inputMode="numeric"
                  placeholder="MM/YY"
                  onChange={(e) => setExpiry(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setFocused('expiry')}
                  onBlur={() => setFocused(null)}
                />
              </label>
              <label className="cc-field">
                <span>CVC</span>
                <input
                  value={cvc}
                  inputMode="numeric"
                  placeholder="•••"
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setFocused('cvc')}
                  onBlur={() => setFocused(null)}
                />
              </label>
            </div>
          </div>
          <div className="sb-controls">
            <label>
              variant
              <select value={variant} onChange={(e) => setVariant(e.target.value)}>
                {['sunset', 'ember', 'holo', 'porcelain', 'graphite', 'gradient'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              test number
              <select
                value=""
                onChange={(e) => e.target.value && setNumber(e.target.value)}
              >
                <option value="">pick…</option>
                {TEST_CARDS.map((t) => (
                  <option key={t.brand} value={t.number}>{t.brand}</option>
                ))}
              </select>
            </label>
            <label>
              tilt
              <select value={tilt ? 'on' : 'off'} onChange={(e) => setTilt(e.target.value === 'on')}>
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </label>
            {brand && <span className="cc-brand">brand: {brand}</span>}
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.jsx" />

      <DocSection
        title="Source"
        desc={
          <>
            The complete crd-ui package, vendored verbatim: the vanilla
            core (<code>card.ts</code> owns the markup — the React
            adapter only forwards props), brand detection/formatting, and
            the stylesheet. Theming is all CSS custom properties — every
            default is a <code>var()</code> fallback, never a declaration,
            so inherited values always reach the card. Built-in brand
            marks are deliberately generic (no trademarked assets); pass{' '}
            <code>logos</code> for official marks if licensed. The
            display-only design is what makes it PCI-friendly: pair it
            with Stripe Elements via <code>brandFromStripe</code> and the
            digits never leave the iframe.
          </>
        }
      >
        <SourceBrowser root="credit-card" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://crd-ui.juanda.co">crd-ui.juanda.co</DocFooter>
    </article>
  )
}
