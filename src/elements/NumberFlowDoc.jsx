import { useState } from 'react'
import NumberFlow, { NumberFlowGroup, continuous } from './number-flow/react'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcLite from './number-flow/lite.ts?raw'
import srcIndex from './number-flow/index.ts?raw'
import srcGroup from './number-flow/group.ts?raw'
import srcFormatter from './number-flow/formatter.ts?raw'
import srcStyles from './number-flow/styles.ts?raw'
import srcSsr from './number-flow/ssr.ts?raw'
import srcCsp from './number-flow/csp.ts?raw'
import srcEnv from './number-flow/env.ts?raw'
import srcPluginsIndex from './number-flow/plugins/index.ts?raw'
import srcContinuous from './number-flow/plugins/continuous.ts?raw'
import srcUtilDom from './number-flow/util/dom.ts?raw'
import srcUtilIterable from './number-flow/util/iterable.ts?raw'
import srcUtilMath from './number-flow/util/math.ts?raw'
import srcUtilString from './number-flow/util/string.ts?raw'
import srcUtilTypes from './number-flow/util/types.ts?raw'
import srcReactIndex from './number-flow/react/index.tsx?raw'
import srcReactNumberFlow from './number-flow/react/NumberFlow.tsx?raw'

const FILES = [
  { path: 'react/index.tsx', code: srcReactIndex },
  { path: 'react/NumberFlow.tsx', code: srcReactNumberFlow },
  { path: 'lite.ts', code: srcLite },
  { path: 'index.ts', code: srcIndex },
  { path: 'group.ts', code: srcGroup },
  { path: 'formatter.ts', code: srcFormatter },
  { path: 'styles.ts', code: srcStyles },
  { path: 'ssr.ts', code: srcSsr },
  { path: 'csp.ts', code: srcCsp },
  { path: 'env.ts', code: srcEnv },
  { path: 'plugins/index.ts', code: srcPluginsIndex },
  { path: 'plugins/continuous.ts', code: srcContinuous },
  { path: 'util/dom.ts', code: srcUtilDom },
  { path: 'util/iterable.ts', code: srcUtilIterable },
  { path: 'util/math.ts', code: srcUtilMath },
  { path: 'util/string.ts', code: srcUtilString },
  { path: 'util/types.ts', code: srcUtilTypes },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `number-flow/${f.path}` })),
  `/*
 * number-flow — NumberFlow by Maxwell Barvian, MIT.
 * Original: https://number-flow.barvian.me · github.com/barvian/number-flow
 * Vendored verbatim: the custom-element core + React wrapper.
 * One change: the 'esm-env' import (upstream's only runtime dep) is a
 * 3-line local env.ts. import NumberFlow from './number-flow/react'.
 */`,
)

const PROPS = [
  { name: 'value', type: 'number', def: '—', desc: 'The number. Changing it animates every digit.' },
  { name: 'format / locales', type: 'Intl options / locales', def: '—', desc: 'Full Intl.NumberFormat control — currency, compact, units, signDisplay.' },
  { name: 'prefix / suffix', type: 'string', def: '""', desc: 'Static text around the number.' },
  { name: 'trend', type: 'number | fn', def: 'sign of delta', desc: '+1 always up, -1 always down, 0 per-digit direction.' },
  { name: 'transform/spin/opacityTiming', type: 'EffectTiming', def: '—', desc: 'Three separate timings — layout transforms, digit spins, character fades. linear() springs work.' },
  { name: 'plugins', type: 'Plugin[]', def: '—', desc: 'continuous makes transitions appear to pass through in-between numbers.' },
  { name: 'isolate / animated / willChange / digits', type: '—', def: '—', desc: 'Isolation from layout changes, animation kill-switch, compositor hint, per-position digit config (59→00 clocks).' },
]

const rand = () => Math.round(Math.random() * 90000) / 100 + Math.floor(Math.random() * 9000)

export default function NumberFlowDoc() {
  const [value, setValue] = useState(3243.6)
  const [trend, setTrend] = useState(0)
  const [cont, setCont] = useState(false)

  const snippet = `import NumberFlow from './number-flow/react'

<NumberFlow
  value={total}
  format={{ style: 'currency', currency: 'USD' }}
  trend={0}                    // per-digit direction
  plugins={[continuous]}       // roll through in-between numbers
/>

// Grouped siblings move in sync when one resizes:
<NumberFlowGroup>
  <NumberFlow value={price} format={{ style: 'currency', currency: 'USD' }} />
  <NumberFlow value={delta} format={{ signDisplay: 'always' }} suffix="%" />
</NumberFlowGroup>`

  const timing = { duration: 900, easing: 'linear(0, 0.85, 1.1, 0.97, 1)' }
  const plugins = cont ? [continuous] : undefined

  return (
    <article className="doc">
      <DocHeader
        title="Number Flow"
        tag="number-flow"
        chip={`number-flow/ · ${FILES.length} files · vendored verbatim · no npm install`}
        copyAll={ALL_SOURCE}
      >
        The animated number: a custom element under the hood, WAAPI for
        the digit reels, gradient masks at the edges, full{' '}
        <code>Intl.NumberFormat</code> semantics. The most complete take
        on odometer numbers — compare it with the transitions.dev Spin
        Counter above.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — shuffle hits a random value; digits trend down or per-digit
          </span>
          <div className="demo-card nf-demo-card">
            <NumberFlowGroup>
              <NumberFlow
                className="nf-demo-num"
                value={value}
                format={{ style: 'currency', currency: 'USD' }}
                trend={trend}
                plugins={plugins}
                transformTiming={timing}
                spinTiming={timing}
                opacityTiming={{ duration: 300, easing: 'ease-out' }}
              />
              <NumberFlow
                className="nf-demo-pct"
                value={value / 50000}
                format={{ style: 'percent', signDisplay: 'always' }}
                trend={trend}
                plugins={plugins}
              />
            </NumberFlowGroup>
          </div>
          <div className="sb-controls">
            <button type="button" className="sb-replay" onClick={() => setValue(rand())}>
              Shuffle
            </button>
            <label>
              trend
              <select value={trend} onChange={(e) => setTrend(Number(e.target.value))}>
                <option value={0}>per digit</option>
                <option value={1}>always up</option>
                <option value={-1}>always down</option>
              </select>
            </label>
            <label>
              continuous
              <select value={cont ? 'on' : 'off'} onChange={(e) => setCont(e.target.value === 'on')}>
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
            The complete <code>@number-flow/react</code> +{' '}
            <code>number-flow</code> core, vendored verbatim — the custom
            element (<code>lite.ts</code>) does per-digit spin reels,
            mask fades, and layout transforms through WAAPI;{' '}
            <code>group.ts</code> syncs siblings that resize each other;
            the <code>continuous</code> plugin rolls through in-between
            values. One adaptation: upstream's single runtime dep{' '}
            <code>esm-env</code> is replaced by a 3-line local{' '}
            <code>env.ts</code> (<code>BROWSER</code> constant) — nothing
            else changed. Style the exposed <code>::part()</code>s or set{' '}
            <code>--number-flow-mask-*</code>; use{' '}
            <code>tabular-nums</code> to stop width jitter.
          </>
        }
      >
        <SourceBrowser root="number-flow" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://number-flow.barvian.me">number-flow.barvian.me</DocFooter>
    </article>
  )
}
