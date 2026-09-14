import { useEffect, useState } from 'react'
import { TextMorph } from './text-morph/react'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcReactIndex from './text-morph/react/index.ts?raw'
import srcTextMorph from './text-morph/react/TextMorph.tsx?raw'
import srcController from './text-morph/lib/text-morph/controller.ts?raw'
import srcTmIndex from './text-morph/lib/text-morph/index.ts?raw'
import srcTmTypes from './text-morph/lib/text-morph/types.ts?raw'
import srcTmAnimate from './text-morph/lib/text-morph/utils/animate.ts?raw'
import srcTmDiff from './text-morph/lib/text-morph/utils/diff.ts?raw'
import srcTmNumberAnimate from './text-morph/lib/text-morph/utils/number-animate.ts?raw'
import srcTmNumber from './text-morph/lib/text-morph/utils/number.ts?raw'
import srcTmReplace from './text-morph/lib/text-morph/utils/replace-animate.ts?raw'
import srcTmSegment from './text-morph/lib/text-morph/utils/segment.ts?raw'
import srcAnimate from './text-morph/lib/utils/animate.ts?raw'
import srcConstants from './text-morph/lib/utils/constants.ts?raw'
import srcDom from './text-morph/lib/utils/dom.ts?raw'
import srcEasing from './text-morph/lib/utils/easing.ts?raw'
import srcFlip from './text-morph/lib/utils/flip.ts?raw'
import srcLcs from './text-morph/lib/utils/lcs.ts?raw'
import srcReducedMotion from './text-morph/lib/utils/reduced-motion.ts?raw'
import srcSpring from './text-morph/lib/utils/spring.ts?raw'
import srcStyles from './text-morph/lib/utils/styles.ts?raw'
import srcTypes from './text-morph/lib/utils/types.ts?raw'

const FILES = [
  { path: 'react/TextMorph.tsx', code: srcTextMorph },
  { path: 'react/index.ts', code: srcReactIndex },
  { path: 'lib/text-morph/controller.ts', code: srcController },
  { path: 'lib/text-morph/index.ts', code: srcTmIndex },
  { path: 'lib/text-morph/types.ts', code: srcTmTypes },
  { path: 'lib/text-morph/utils/animate.ts', code: srcTmAnimate },
  { path: 'lib/text-morph/utils/diff.ts', code: srcTmDiff },
  { path: 'lib/text-morph/utils/segment.ts', code: srcTmSegment },
  { path: 'lib/text-morph/utils/number.ts', code: srcTmNumber },
  { path: 'lib/text-morph/utils/number-animate.ts', code: srcTmNumberAnimate },
  { path: 'lib/text-morph/utils/replace-animate.ts', code: srcTmReplace },
  { path: 'lib/utils/animate.ts', code: srcAnimate },
  { path: 'lib/utils/flip.ts', code: srcFlip },
  { path: 'lib/utils/spring.ts', code: srcSpring },
  { path: 'lib/utils/easing.ts', code: srcEasing },
  { path: 'lib/utils/lcs.ts', code: srcLcs },
  { path: 'lib/utils/dom.ts', code: srcDom },
  { path: 'lib/utils/styles.ts', code: srcStyles },
  { path: 'lib/utils/constants.ts', code: srcConstants },
  { path: 'lib/utils/reduced-motion.ts', code: srcReducedMotion },
  { path: 'lib/utils/types.ts', code: srcTypes },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `text-morph/${f.path}` })),
  `/*
 * text-morph — torph 0.1.3 by Lochie Axon, MIT.
 * Original: https://torph.lochie.me · github.com/lochie/torph
 * Vendored verbatim: the core engine + the React wrapper
 * (Vue/Svelte bindings and tests omitted). No npm install —
 * import { TextMorph } from './text-morph/react'.
 */`,
)

const PROPS = [
  { name: 'children', type: 'string | number', def: '—', desc: 'The text to morph. Text only — elements throw; change it to morph.' },
  { name: 'numbers', type: 'boolean', def: 'false', desc: 'Morph numeric words by place value — digits slide vertically, symbols carry over.' },
  { name: 'decimals', type: 'number', def: '—', desc: 'Fraction digits when the whole value is one number.' },
  { name: 'locale', type: 'Intl locale', def: '"en"', desc: 'Grouping/format for numeric morphs.' },
  { name: 'duration / ease', type: 'ms / string | spring', def: '400 / ease-out-quint', desc: 'Ignored when ease is a spring — it settles on its own physics.' },
  { name: 'scale', type: 'boolean', def: 'false', desc: 'Scale letters during the morph for a squishier feel.' },
  { name: 'disabled / respectReducedMotion', type: 'boolean', def: 'false / true', desc: 'Escape hatches.' },
  { name: 'as / className / style', type: 'ElementType / —', def: '"span"', desc: 'Rendered element and passthrough.' },
]

const PHRASES = [
  'Processing transaction',
  'Verifying signature',
  'Broadcasting to network',
  'Transaction complete',
]

export default function TextMorphDoc() {
  const [step, setStep] = useState(0)
  const [count, setCount] = useState(1284.5)
  const [auto, setAuto] = useState(false)

  useEffect(() => {
    if (!auto) return
    const id = setInterval(() => {
      setStep((s) => (s + 1) % PHRASES.length)
      setCount((c) => Math.round(c * 1.7 * 100) / 100 + 13.37)
    }, 1600)
    return () => clearInterval(id)
  }, [auto])

  const snippet = `import { TextMorph } from './text-morph/react'

<TextMorph>{status}</TextMorph>

// numbers=true morphs by place value — carries, decimal point,
// and digit slides all handled:
<TextMorph numbers decimals={2} locale="en-US">{total}</TextMorph>`

  return (
    <article className="doc">
      <DocHeader
        title="Text Morph"
        tag="torph"
        chip={`text-morph/ · ${FILES.length} files · vendored verbatim · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Text continuity: change the string and shared letters glide to
        their new positions while the rest fade — no hard swap. Numbers
        get a place-value morph where digits slide vertically like an
        odometer.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — letters persist between phrases; digits slide by place value
          </span>
          <div className="demo-card tm-demo-card">
            <TextMorph className="tm-demo-text" key="phrase">
              {PHRASES[step]}
            </TextMorph>
            <TextMorph numbers decimals={2} locale="en-US" className="tm-demo-num" key="num">
              {count}
            </TextMorph>
          </div>
          <div className="sb-controls">
            <label>
              phrase
              <select value={step} onChange={(e) => setStep(Number(e.target.value))}>
                {PHRASES.map((p, i) => (
                  <option key={p} value={i}>{p}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="sb-replay"
              onClick={() => setCount((c) => Math.round(c * 1.618 * 100) / 100)}
            >
              × φ
            </button>
            <label>
              auto
              <select value={auto ? 'on' : 'off'} onChange={(e) => setAuto(e.target.value === 'on')}>
                <option value="off">off</option>
                <option value="on">on</option>
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
            The complete <code>torph</code> engine + React wrapper,
            vendored verbatim (Vue/Svelte bindings and tests omitted —
            the same morph core runs in all three). The mechanism: text
            is segmented into letters/words with stable ids, an LCS diff
            matches old segments to new, and FLIP-style transforms slide
            the shared ones while exits fade. With{' '}
            <code>numbers</code>, numeric words are split by place value
            so <code>1,284.50 → 2,091.16</code> slides digits vertically
            and carries the comma along. Springs are simulated and played
            through the Web Animations API.
          </>
        }
      >
        <SourceBrowser root="text-morph" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://torph.lochie.me">torph.lochie.me</DocFooter>
    </article>
  )
}
