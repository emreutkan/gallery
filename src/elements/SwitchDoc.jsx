import { useState } from 'react'
import { Switch, SizeProvider } from './switch/switch'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './switch/switch.tsx?raw'
import srcSize from './switch/size-context.tsx?raw'
import srcCss from './switch/switch.css?raw'

const FILES = [
  { path: 'switch.tsx', code: srcComponent },
  { path: 'size-context.tsx', code: srcSize },
  { path: 'switch.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `switch/${f.path}` })),
  `/*
 * switch — adapted from fluidfunctionalism.com, zero dependencies.
 * Original: https://www.fluidfunctionalism.com/docs/switch
 * framer-motion → imperative critically-damped spring; Base UI
 * SwitchPrimitive → role="switch" button; Tailwind → switch.css.
 * size-context.tsx is the vendored size ladder the switch resolves.
 */`,
)

const PROPS = [
  { name: 'label', type: 'string', def: '—', desc: 'Text label next to the switch; also its accessible name via aria-labelledby.' },
  { name: 'checked', type: 'boolean', def: '—', desc: 'Whether the switch is on.' },
  { name: 'onToggle', type: '() => void', def: '—', desc: 'Called on click, keypress and drag-release toggles.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Disables the switch.' },
  { name: 'size', type: '"default" | "compact"', def: 'SizeProvider', desc: 'Pins the switch to one step of the size ladder.' },
]

export default function SwitchDoc() {
  const [notifications, setNotifications] = useState(true)
  const [digest, setDigest] = useState(false)
  const [compact, setCompact] = useState(true)

  const snippet = `import { useState } from 'react'
import { Switch } from './switch/switch'

const [checked, setChecked] = useState(false)

<Switch
  label="Notifications"
  checked={checked}
  onToggle={() => setChecked((prev) => !prev)}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Switch"
        tag="fluidfunctionalism"
        chip={`switch/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Toggle switch with an animated thumb and label. The thumb drags under
        the pointer, squashes on press, widens on hover, and springs to its
        rest — drag past the midpoint to flip, release short to snap back.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — click, press-and-drag the thumb, or Space
          </span>
          <div className="demo-card" style={{ width: 'min(320px, 100%)' }}>
            <div className="sw-demo-rows">
              <Switch
                label="Notifications"
                checked={notifications}
                onToggle={() => setNotifications((v) => !v)}
              />
              <Switch
                label="Weekly digest"
                checked={digest}
                onToggle={() => setDigest((v) => !v)}
              />
              <Switch
                label="Locked setting"
                checked={false}
                onToggle={() => {}}
                disabled
              />
              <div className="sw-demo-sep" />
              <SizeProvider size="compact">
                <Switch
                  label="Compact row"
                  checked={compact}
                  onToggle={() => setCompact((v) => !v)}
                />
              </SizeProvider>
            </div>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from fluidfunctionalism.com (Base UI flavor). Upstream
            drives the thumb with a MotionValue +{' '}
            <code>animate(x, spring.moderate)</code>; here the same thumb X
            lives in a ref and is written straight to the DOM — drag deltas,
            the midpoint verdict, and the snap-back are identical. The
            settle is a critically damped spring tuned to the 160ms tier.
            Base UI's <code>SwitchPrimitive</code> becomes a{' '}
            <code>role="switch"</code> button, so Space/Enter toggle
            natively. <code>size-context.tsx</code> is vendored — the
            demo's last row runs inside <code>SizeProvider</code>.
          </>
        }
      >
        <SourceBrowser root="switch" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.fluidfunctionalism.com/docs/switch">
        fluidfunctionalism.com/docs/switch
      </DocFooter>
    </article>
  )
}
