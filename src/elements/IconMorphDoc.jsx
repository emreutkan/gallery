import { useState } from 'react'
import { IconMorph } from './icon-morph/icon-morph'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Segmented, Switch } from '../components/controls.jsx'

import srcComponent from './icon-morph/icon-morph.tsx?raw'
import srcCss from './icon-morph/icon-morph.css?raw'

const FILES = [
  { path: 'icon-morph.tsx', code: srcComponent },
  { path: 'icon-morph.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `icon-morph/${f.path}` })),
  `/*
 * icon-morph — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/icon-morph
 * Path morphs are a rAF tween over matched number slots — no motion lib.
 */`,
)

const PRESETS = ['menu-close', 'play-pause', 'plus-minus', 'check-close']

const PROPS = [
  { name: 'preset', type: 'IconMorphPreset', def: '"menu-close"', desc: 'Built-in shape pair — menu-close, play-pause, plus-minus, check-close. Paths share a command signature so geometry interpolates.' },
  { name: 'shapes', type: 'MorphShape[]', def: '—', desc: 'Custom shapes override the preset — same-length d strings, rotate optional.' },
  { name: 'active', type: 'number | boolean', def: '—', desc: 'Controlled index; omit for uncontrolled (defaultActive).' },
  { name: 'onActiveChange', type: '(index) => void', def: '—', desc: 'Fires with the wrapped index after every toggle.' },
  { name: 'size', type: 'number', def: '20', desc: 'SVG box in px.' },
  { name: 'strokeWidth', type: 'number', def: '1.75', desc: 'Stroke presets only — fill presets ignore it.' },
  { name: 'showLabel', type: 'boolean', def: 'false', desc: 'Adds the state label beside the icon; labels crossfade like the shapes.' },
  { name: 'semantics', type: "'label' | 'pressed' | 'expanded'", def: "'label'", desc: 'Which ARIA state index 1 maps to — pick the one that matches the metaphor.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Native disabled.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last.' },
]

export default function IconMorphDoc() {
  const [preset, setPreset] = useState('menu-close')
  const [showLabel, setShowLabel] = useState(false)

  const snippet = `import { IconMorph } from './icon-morph/icon-morph'

<IconMorph
  preset="${preset}"
  semantics="pressed"${showLabel ? '\n  showLabel' : ''}
  active={open}
  onActiveChange={(i) => setOpen(i === 1)}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Icon Morph"
        tag="interior.dev"
        chip={`icon-morph/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Play/pause, menu/close as one mechanism. The two states share a command
        signature, so the icon tweens its geometry instead of swapping images.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — click it</span>
          <div className="demo-col">
            <IconMorph preset={preset} showLabel={showLabel} semantics="pressed" />
            <div className="demo-row-inline">
              {PRESETS.map((p) => (
                <IconMorph key={p} preset={p} aria-label={p} />
              ))}
            </div>
          </div>
          <span className="stage-size-note">all four presets, live</span>
        </div>
        <div className="controls">
          <Control label="Preset">
            <Segmented
              options={PRESETS}
              value={preset}
              onChange={setPreset}
              ariaLabel="Icon preset"
            />
          </Control>
          <Control label="Show label">
            <Switch checked={showLabel} onChange={setShowLabel} ariaLabel="Show label" />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — the preset table,{' '}
            <code>normalize</code> and <code>useIconMorph</code> are verbatim;
            upstream&rsquo;s motion <code>d</code> interpolation is replaced by
            a 260ms rAF tween over the matched number slots (same easing curve,
            exact same math — paths keep their command signature by
            construction, so a numeric lerp is lossless).
          </>
        }
      >
        <SourceBrowser root="icon-morph" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/icon-morph">
        interior.dev/docs/icon-morph
      </DocFooter>
    </article>
  )
}
