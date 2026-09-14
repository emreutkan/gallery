import { useState } from 'react'
import { ColorPicker, ColorPickerPopover } from './color-picker/color-picker'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './color-picker/color-picker.tsx?raw'
import srcMath from './color-picker/color-math.ts?raw'
import srcSize from './color-picker/size-context.tsx?raw'
import srcCss from './color-picker/color-picker.css?raw'

const FILES = [
  { path: 'color-picker.tsx', code: srcComponent },
  { path: 'color-math.ts', code: srcMath },
  { path: 'size-context.tsx', code: srcSize },
  { path: 'color-picker.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `color-picker/${f.path}` })),
  `/*
 * color-picker — adapted from fluidfunctionalism.com, zero dependencies.
 * Original: https://www.fluidfunctionalism.com/docs/color-picker
 * @base-ui/react (popover/menu/number-field) → local popup, dropdown, and
 * scrub input; components/ui/slider → local gradient-track slider;
 * framer-motion → CSS transitions; Tailwind → color-picker.css.
 * color-math.ts is the verbatim conversion/parse module.
 */`,
)

const PROPS = [
  { name: 'value', type: 'string', def: '—', desc: 'Controlled color in any supported format.' },
  { name: 'defaultValue', type: 'string', def: '"#6B97FF"', desc: 'Initial color when uncontrolled.' },
  { name: 'onValueChange', type: '(value, parsed) => void', def: '—', desc: 'Fired on every change with the formatted string + parsed color object.' },
  { name: 'format / defaultFormat', type: '"hex" | "rgb" | "hsl" | "oklch"', def: '"hex"', desc: 'Controlled / initial format selection.' },
  { name: 'swatches', type: 'string[]', def: '—', desc: 'Preset swatch strip; hidden when omitted.' },
  { name: 'hideEyedropper', type: 'boolean', def: 'false', desc: 'Force-hide the eyedropper button (auto-hidden when unsupported).' },
  { name: 'size', type: '"default" | "compact"', def: 'SizeProvider', desc: 'Pins the whole panel to one step of the ladder.' },
]

const POPOVER_PROPS = [
  { name: 'triggerLabel', type: 'string', def: '—', desc: 'Label next to the color tile (triggerLabelPosition flips it).' },
  { name: 'triggerShowValue', type: 'boolean', def: 'true', desc: 'Show the hex value next to the tile.' },
  { name: 'triggerShowRemove', type: 'boolean', def: 'false', desc: 'X button on the trigger; pairs with onTriggerRemove.' },
  { name: 'open / onOpenChange', type: 'boolean / (open) => void', def: '—', desc: 'Controlled open state for the popup.' },
]

const SWATCHES = ['#6B97FF', '#F2545B', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#1c1917', '#78716c']

export default function ColorPickerDoc() {
  const [color, setColor] = useState('#6B97FF')
  const [popColor, setPopColor] = useState('#F2545B')
  const [compact, setCompact] = useState(false)

  const snippet = `import { ColorPicker, ColorPickerPopover } from './color-picker/color-picker'
import { useState } from 'react'

const [color, setColor] = useState('#6B97FF')

// Inline panel, controlled
<ColorPicker value={color} onValueChange={(v) => setColor(v)} />

// Popover with a trigger tile and label
<ColorPickerPopover triggerLabel="Fill" defaultValue="#6B97FF" />`

  return (
    <article className="doc">
      <DocHeader
        title="Color Picker"
        tag="fluidfunctionalism"
        chip={`color-picker/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        SV pad + hue/alpha sliders, HEX/RGB/HSL/OKLCH formats with
        drag-scrub channel inputs, an eyedropper, and a swatch strip — plus a
        popover variant with a trigger tile. Numeric fields nudge with arrow
        keys, scrub by dragging, and revert on Esc.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — drag the pad, drag a channel field horizontally to scrub
          </span>
          <div className="cp-demo-row">
            <ColorPicker
              value={color}
              onValueChange={(v) => setColor(v)}
              swatches={SWATCHES}
              size={compact ? 'compact' : 'default'}
            />
            <div className="cp-demo-side">
              <div
                className="cp-demo-swatch"
                style={{ background: color }}
              />
              <code className="cp-demo-value">{color}</code>
              <div className="cp-demo-pops">
                <ColorPickerPopover
                  triggerLabel="Fill"
                  value={popColor}
                  onValueChange={(v) => setPopColor(v)}
                  swatches={SWATCHES}
                />
                <ColorPickerPopover
                  defaultValue="#10B981"
                  triggerShowValue={false}
                  triggerShowRemove
                  onTriggerRemove={() => {}}
                  swatches={SWATCHES}
                />
              </div>
            </div>
          </div>
          <div className="sb-controls">
            <label>
              size
              <select value={compact ? 'compact' : 'default'} onChange={(e) => setCompact(e.target.value === 'compact')}>
                <option value="default">default</option>
                <option value="compact">compact</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from fluidfunctionalism.com (Base UI flavor, ~76KB).{' '}
            <code>color-math.ts</code> is verbatim — full{' '}
            hsv/rgb/hsl/oklab/oklch conversions, <code>parseColor</code>, and
            the canvas <code>resolveCssColor</code> fallback that makes named
            colors work in the hex field. The shared <code>Slider</code>, Base
            UI's <code>Menu</code>/<code>NumberField</code>/
            <code>Popover</code> primitives, and framer-motion are replaced
            locally: gradient-track sliders, a radio-semantic format dropdown
            with arrow nav, click-to-edit scrub fields (drag to nudge, the ↔
            cursor appears), and an anchored popup with outside-press/Esc
            dismissal and focus restore. The sticky-OKLCH-hue trick is
            preserved — L/C edits anchor on your last stated H so it doesn't
            drift through the lossy RGB round-trip.
          </>
        }
      >
        <SourceBrowser root="color-picker" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>
      <DocSection title="ColorPickerPopover">
        <PropsTable props={POPOVER_PROPS} />
      </DocSection>

      <DocFooter href="https://www.fluidfunctionalism.com/docs/color-picker">
        fluidfunctionalism.com/docs/color-picker
      </DocFooter>
    </article>
  )
}
