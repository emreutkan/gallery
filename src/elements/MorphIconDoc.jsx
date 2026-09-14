import { useState } from 'react'
import { MorphIcon } from './morph-icon/react'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcIndex from './morph-icon/index.ts?raw'
import srcReact from './morph-icon/react/index.tsx?raw'
import srcInterpolate from './morph-icon/core/interpolate.ts?raw'
import srcNormalize from './morph-icon/core/normalize.ts?raw'
import srcParse from './morph-icon/core/parse.ts?raw'
import srcPlan from './morph-icon/core/plan.ts?raw'
import srcResample from './morph-icon/core/resample.ts?raw'
import srcSerialize from './morph-icon/core/serialize.ts?raw'
import srcSpring from './morph-icon/core/spring.ts?raw'
import srcTypes from './morph-icon/core/types.ts?raw'
import srcDomController from './morph-icon/dom/controller.ts?raw'
import srcDomIndex from './morph-icon/dom/index.ts?raw'
import srcAdaptersIndex from './morph-icon/adapters/index.ts?raw'
import srcMask from './morph-icon/adapters/mask.ts?raw'
import srcSvg from './morph-icon/adapters/svg.ts?raw'
import srcCanvas from './morph-icon/adapters/canvas.ts?raw'

const FILES = [
  { path: 'index.ts', code: srcIndex },
  { path: 'react/index.tsx', code: srcReact },
  { path: 'core/plan.ts', code: srcPlan },
  { path: 'core/normalize.ts', code: srcNormalize },
  { path: 'core/parse.ts', code: srcParse },
  { path: 'core/resample.ts', code: srcResample },
  { path: 'core/interpolate.ts', code: srcInterpolate },
  { path: 'core/serialize.ts', code: srcSerialize },
  { path: 'core/spring.ts', code: srcSpring },
  { path: 'core/types.ts', code: srcTypes },
  { path: 'dom/controller.ts', code: srcDomController },
  { path: 'dom/index.ts', code: srcDomIndex },
  { path: 'adapters/index.ts', code: srcAdaptersIndex },
  { path: 'adapters/svg.ts', code: srcSvg },
  { path: 'adapters/mask.ts', code: srcMask },
  { path: 'adapters/canvas.ts', code: srcCanvas },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `morph-icon/${f.path}` })),
  `/*
 * morph-icon — morphicons by Guillermo Lopez, MIT.
 * Original: https://www.morphicons.com · github.com/guillermolg00/morphicons
 * Vendored verbatim: core math + DOM driver + SVG/mask/canvas
 * adapters + React wrapper (Vue/Svelte/RN/Astro entries omitted).
 * Icons are DATA — a Lucide IconNode or a raw \`d\` string:
 *   const MENU = "M4 6h16M4 12h16M4 18h16";
 *   <MorphIcon icon={open ? X : MENU} />
 */`,
)

// 24×24 stroke icons as raw `d` data — no icon package needed.
const ICONS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  x: 'M18 6L6 18M6 6l12 12',
  'arrow →': 'M5 12h14M12 5l7 7-7 7',
  check: 'M20 6L9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
}

const PROPS = [
  { name: 'icon', type: 'IconInput', def: '—', desc: 'Uncontrolled: change it and it morphs. IconNode tuples or a raw d string.' },
  { name: 'from / to / progress', type: 'IconInput / 0..1', def: '—', desc: 'Controlled mode — scrub a frozen morph with a slider, no spring.' },
  { name: 'spring', type: '"smooth" | "snappy" | "bouncy" | config', def: '"smooth"', desc: 'Physics for uncontrolled/imperative morphs. Interruptible mid-flight.' },
  { name: 'size / color / strokeWidth', type: 'number | string', def: '24 / currentColor / 2', desc: 'Presentation. absoluteStrokeWidth keeps width constant across sizes.' },
  { name: 'reducedMotion', type: '"never" | "user" | "always"', def: '"never"', desc: '"user" honors prefers-reduced-motion with an instant swap.' },
  { name: 'label', type: 'string', def: '—', desc: 'A11y: with label → role="img" + <title>; without → aria-hidden.' },
  { name: 'ref → MorphHandle', type: '{ morphTo, set }', def: '—', desc: 'Imperative morphing without prop changes.' },
]

export default function MorphIconDoc() {
  const [iconName, setIconName] = useState('menu')
  const [spring, setSpring] = useState('bouncy')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [progress, setProgress] = useState(0)

  const snippet = `import { MorphIcon } from './morph-icon/react'

// Icons are data — a raw d string or a Lucide IconNode:
const MENU = 'M4 6h16M4 12h16M4 18h16'
const X = 'M18 6L6 18M6 6l12 12'

<MorphIcon icon={open ? X : MENU} spring="bouncy" />

// Controlled: scrub the frozen morph yourself.
<MorphIcon from={MENU} to={X} progress={t} />`

  return (
    <article className="doc">
      <DocHeader
        title="Morph Icon"
        tag="morphicons"
        chip={`morph-icon/ · ${FILES.length} files · vendored verbatim · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Morph any stroke icon into any other — menu↔×, arrow↔check, any
        pair. Optimal rotation is solved in closed form (2D Procrustes)
        and the morph runs on interruptible springs. The serious sibling
        of the Icon Morph above.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — pick a target; try mid-flight interrupts by clicking fast
          </span>
          <div className="demo-card mi-demo-card">
            <div className="mi-hero">
              <MorphIcon
                icon={ICONS[iconName]}
                spring={spring}
                size={56}
                strokeWidth={strokeWidth}
                label={iconName}
              />
            </div>
            <div className="mi-picker">
              {Object.keys(ICONS).map((name) => (
                <button
                  key={name}
                  type="button"
                  className={'mi-pick' + (name === iconName ? ' is-active' : '')}
                  onClick={() => setIconName(name)}
                  aria-label={name}
                >
                  <MorphIcon icon={ICONS[name]} size={18} strokeWidth={strokeWidth} />
                </button>
              ))}
            </div>
          </div>
          <div className="sb-controls">
            <label>
              spring
              <select value={spring} onChange={(e) => setSpring(e.target.value)}>
                <option value="smooth">smooth</option>
                <option value="snappy">snappy</option>
                <option value="bouncy">bouncy</option>
              </select>
            </label>
            <label>
              stroke
              <select value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))}>
                <option value={1.5}>1.5</option>
                <option value={2}>2</option>
                <option value={2.5}>2.5</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            controlled mode — scrub t to freeze the morph anywhere (menu → ×)
          </span>
          <div className="demo-card mi-demo-card">
            <MorphIcon
              from={ICONS.menu}
              to={ICONS.x}
              progress={progress}
              size={56}
              strokeWidth={strokeWidth}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              style={{ width: 200, accentColor: 'var(--fg, #1c1917)' }}
            />
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.jsx" />

      <DocSection
        title="Source"
        desc={
          <>
            The whole morphicons package, vendored verbatim (16 files):
            the DOM-free core math, the DOM driver, the output adapters,
            and the React wrapper. The math is the point — before
            morphing, the engine solves the optimal similarity transform
            between the two shapes in closed form (2D Procrustes), so
            congruent pairs rotate and the rest morph in the aligned
            frame; nobody declares rotation groups by hand. Icons are
            consumed as data — a raw <code>d</code> string or Lucide's{' '}
            <code>IconNode</code> tuples — so this demo ships its own
            paths instead of an icon package. The unused adapters
            (canvas, mask, svg) come along in the source browser because
            they're the interesting part for ports.
          </>
        }
      >
        <SourceBrowser root="morph-icon" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.morphicons.com">morphicons.com</DocFooter>
    </article>
  )
}
