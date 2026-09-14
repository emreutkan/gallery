import { useMemo, useState } from 'react'
import { ThinkingOrb } from './thinking-orb/ThinkingOrb'
import CodeBlock from '../components/CodeBlock.jsx'
import CopyButton from '../components/CopyButton.jsx'
import SourceBrowser from '../components/SourceBrowser.jsx'
import { Control, Segmented, Switch } from '../components/controls.jsx'

import srcIndex from './thinking-orb/index.ts?raw'
import srcComponent from './thinking-orb/ThinkingOrb.tsx?raw'
import srcTypes from './thinking-orb/types.ts?raw'
import srcTheme from './thinking-orb/theme.ts?raw'
import srcPresets from './thinking-orb/presets.ts?raw'
import srcEngineIndex from './thinking-orb/engine/index.ts?raw'
import srcEngineTypes from './thinking-orb/engine/types.ts?raw'
import srcEngineCore from './thinking-orb/engine/core.ts?raw'
import srcEngineProfiles from './thinking-orb/engine/profiles.ts?raw'
import srcEngineRegistry from './thinking-orb/engine/registry.ts?raw'
import srcEngineOrbits from './thinking-orb/engine/orbits.ts?raw'
import srcEngineLattice from './thinking-orb/engine/lattice.ts?raw'
import srcEngineWeb from './thinking-orb/engine/web.ts?raw'
import srcEngineBraid from './thinking-orb/engine/braid.ts?raw'
import srcEngineRibbon from './thinking-orb/engine/ribbon.ts?raw'
import srcEngineMorph from './thinking-orb/engine/morph.ts?raw'

// Reading order for the file browser.
const SOURCE_FILES = [
  { path: 'index.ts', code: srcIndex },
  { path: 'ThinkingOrb.tsx', code: srcComponent },
  { path: 'types.ts', code: srcTypes },
  { path: 'theme.ts', code: srcTheme },
  { path: 'presets.ts', code: srcPresets },
  { path: 'engine/index.ts', code: srcEngineIndex, dir: 'engine/' },
  { path: 'engine/types.ts', code: srcEngineTypes, dir: 'engine/' },
  { path: 'engine/core.ts', code: srcEngineCore, dir: 'engine/' },
  { path: 'engine/profiles.ts', code: srcEngineProfiles, dir: 'engine/' },
  { path: 'engine/registry.ts', code: srcEngineRegistry, dir: 'engine/' },
  { path: 'engine/orbits.ts', code: srcEngineOrbits, dir: 'engine/' },
  { path: 'engine/lattice.ts', code: srcEngineLattice, dir: 'engine/' },
  { path: 'engine/web.ts', code: srcEngineWeb, dir: 'engine/' },
  { path: 'engine/braid.ts', code: srcEngineBraid, dir: 'engine/' },
  { path: 'engine/ribbon.ts', code: srcEngineRibbon, dir: 'engine/' },
  { path: 'engine/morph.ts', code: srcEngineMorph, dir: 'engine/' },
]

// Copy-all concatenates in dependency order so a pasted bundle reads
// bottom-up: primitives, then painters, then the public surface.
const COPY_ORDER = [
  'engine/types.ts',
  'engine/core.ts',
  'engine/profiles.ts',
  'engine/orbits.ts',
  'engine/lattice.ts',
  'engine/web.ts',
  'engine/braid.ts',
  'engine/ribbon.ts',
  'engine/morph.ts',
  'engine/registry.ts',
  'engine/index.ts',
  'types.ts',
  'presets.ts',
  'theme.ts',
  'ThinkingOrb.tsx',
  'index.ts',
]

const ALL_SOURCE = `/*
 * thinking-orbs — complete source, ${SOURCE_FILES.length} files concatenated.
 * MIT License © 2026 Jakub Antalik · https://github.com/Jakubantalik/thinking-orbs
 *
 * Split on the "── file:" markers. The engine/ subtree is platform-agnostic —
 * no React, no DOM — so porting it (plus presets.ts and types.ts) gives you the
 * animations in any language. ThinkingOrb.tsx is only the React/canvas binding.
 */

` + COPY_ORDER.map((p) => {
  const f = SOURCE_FILES.find((s) => s.path === p)
  return `// ── file: thinking-orb/${p} ${'─'.repeat(Math.max(2, 60 - p.length))}\n\n${f.code.trimEnd()}`
}).join('\n\n')

const STATES = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
]

const STATE_BLURBS = {
  working: 'particles on tilted orbits',
  searching: 'a scan meridian sweeps a dotted globe',
  solving: 'bands scramble, then click back',
  listening: 'a waveform rolls through the rings',
  connecting: 'a constellation wires itself',
  weaving: 'three strands plait around the sphere',
  composing: 'an undulating multi-band sash',
  breathing: 'a ring slowly morphing',
  shaping: 'dotted outline: circle → triangle → square',
}

const PROPS = [
  {
    name: 'state',
    type: 'OrbState',
    def: "'working'",
    desc: 'Which animation to show — one of the nine states above.',
  },
  {
    name: 'size',
    type: '64 | 20',
    def: '64',
    desc: 'Tuned size preset in CSS px. 64 for chat-avatar scale, 20 for inline-text scale — separate designs, not a scale factor.',
  },
  {
    name: 'theme',
    type: "'auto' | 'dark' | 'light'",
    def: "'auto'",
    desc: "Ink mode. 'auto' follows an ancestor .dark/.light class, data-theme attribute, or prefers-color-scheme, live.",
  },
  {
    name: 'speed',
    type: 'number',
    def: '1',
    desc: "Animation speed multiplier on top of the preset's baked speed.",
  },
  {
    name: 'paused',
    type: 'boolean',
    def: 'false',
    desc: 'Freeze the animation on the current frame.',
  },
  {
    name: 'aria-label',
    type: 'string',
    def: 'per state',
    desc: 'Overrides the per-state default accessible label.',
  },
]

export default function ThinkingOrbDoc() {
  const [state, setState] = useState('working')
  const [size, setSize] = useState(64)
  const [theme, setTheme] = useState('auto')
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)

  const snippet = useMemo(() => {
    const props = []
    if (state !== 'working') props.push(`state="${state}"`)
    if (size !== 64) props.push(`size={${size}}`)
    if (theme !== 'auto') props.push(`theme="${theme}"`)
    if (speed !== 1) props.push(`speed={${speed}}`)
    if (paused) props.push('paused')
    const el = props.length ? `<ThinkingOrb ${props.join(' ')} />` : '<ThinkingOrb />'
    return `import { ThinkingOrb } from './thinking-orb'\n\n${el}`
  }, [state, size, theme, speed, paused])

  return (
    <article className="doc">
      <header className="doc-head">
        <div className="doc-title-row">
          <h1 className="doc-title">Thinking Orb</h1>
          <span className="pkg-tag">thinking-orbs</span>
        </div>
        <p className="doc-desc">
          Nine hand-tuned animated states that replace the spinner in an AI
          &ldquo;thinking&rdquo; moment. Rendered on a plain 2D canvas, strict
          monochrome ink that follows your theme — vendored below in full, zero
          dependencies, so the code drops into any project (or ports to any
          platform).
        </p>
        <div className="install-row">
          <code className="install-chip">
            thinking-orb/ · {SOURCE_FILES.length} files · MIT · no npm install
          </code>
          <CopyButton text={ALL_SOURCE} label="Copy all source" />
        </div>
      </header>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview</span>
          <ThinkingOrb
            state={state}
            size={size}
            theme={theme}
            speed={speed}
            paused={paused}
            style={size === 64 ? { width: 128, height: 128 } : { width: 40, height: 40 }}
          />
          <span className="stage-size-note">
            {size === 64 ? '64 px preset, shown 2×' : '20 px preset, shown 2×'}
          </span>
        </div>
        <div className="controls">
          <Control label="State">
            <Segmented options={STATES} value={state} onChange={setState} ariaLabel="Orb state" />
          </Control>
          <Control label="Size">
            <Segmented
              options={[64, 20]}
              value={size}
              onChange={setSize}
              ariaLabel="Orb size"
            />
          </Control>
          <Control label="Theme">
            <Segmented
              options={['auto', 'light', 'dark']}
              value={theme}
              onChange={setTheme}
              ariaLabel="Orb theme"
            />
          </Control>
          <Control label="Speed">
            <div className="slider-row">
              <input
                type="range"
                min="0.25"
                max="3"
                step="0.25"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                aria-label="Animation speed"
              />
              <span className="slider-val">{speed}×</span>
            </div>
          </Control>
          <Control label="Paused">
            <Switch checked={paused} onChange={setPaused} ariaLabel="Pause animation" />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <section className="section">
        <h2 className="section-title">Source</h2>
        <p className="section-desc">
          The complete implementation, vendored from{' '}
          <code>thinking-orbs</code> — no build step, no package. Copy a file,
          or take all {SOURCE_FILES.length} at once: the{' '}
          <code>engine/</code> subtree is pure geometry with no React or DOM
          dependency, which makes it the right unit to hand to an agent for
          porting to Swift, Kotlin, Skia, or anywhere else.
        </p>
        <SourceBrowser root="thinking-orb" files={SOURCE_FILES} all={ALL_SOURCE} defaultFile="ThinkingOrb.tsx" />
      </section>

      <section className="section">
        <h2 className="section-title">States</h2>
        <p className="section-desc">
          Nine verbs an agent can be doing, each a distinct animation. Select one
          to load it into the preview and the generated code.
        </p>
        <div className="states-grid">
          {STATES.map((s) => (
            <button
              key={s}
              type="button"
              className={`state-cell${s === state ? ' on' : ''}`}
              onClick={() => setState(s)}
              title={STATE_BLURBS[s]}
              aria-pressed={s === state}
            >
              <ThinkingOrb state={s} size={64} theme={theme} speed={speed} paused={paused} />
              <span className="state-cell-label">{s}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">In context</h2>
        <p className="section-desc">
          The 20 px preset is tuned for inline-text scale — the size you want
          inside a chat row or a status line.
        </p>
        <div className="demo-row">
          <div className="demo-card">
            <div className="demo-card-label">size=&#123;20&#125; · chat status</div>
            <div className="chat-bubble">
              <ThinkingOrb state="searching" size={20} theme={theme} />
              Searching the web&hellip;
            </div>
          </div>
          <div className="demo-card">
            <div className="demo-card-label">size=&#123;64&#125; · avatar scale</div>
            <div className="chat-line">
              <ThinkingOrb state="listening" size={64} theme={theme} />
              <span>
                Listening&hellip;
                <br />
                <span style={{ color: 'var(--muted-fg)', fontSize: 13 }}>
                  the orb stands in for the agent&rsquo;s avatar
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Props</h2>
        <p className="section-desc">
          All <code>&lt;canvas&gt;</code> attributes pass through. Instances pause
          offscreen and honor <code>prefers-reduced-motion</code> automatically.
        </p>
        <div className="table-scroll">
          <table className="props-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {PROPS.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>
                    <span className="type">{p.type}</span>
                  </td>
                  <td>
                    <code className="def">{p.def}</code>
                  </td>
                  <td>{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="foot">
        <span>
          Source:{' '}
          <a href="https://libraries.dev/orbs.html" target="_blank" rel="noreferrer">
            Libraries.dev
          </a>{' '}
          · MIT © Jakub Antalik
        </span>
        <span>AI &amp; Agents · 1 element</span>
      </footer>
    </article>
  )
}
