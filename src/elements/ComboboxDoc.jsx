import { useState } from 'react'
import {
  Combobox,
  ComboboxInput,
  ComboboxChips,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from './combobox/combobox'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './combobox/combobox.tsx?raw'
import srcSize from './combobox/size-context.tsx?raw'
import srcCss from './combobox/combobox.css?raw'

const FILES = [
  { path: 'combobox.tsx', code: srcComponent },
  { path: 'size-context.tsx', code: srcSize },
  { path: 'combobox.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `combobox/${f.path}` })),
  `/*
 * combobox — adapted from fluidfunctionalism.com, zero dependencies.
 * Original: https://www.fluidfunctionalism.com/docs/combobox
 * Base UI's primitive (filter, ARIA wiring, positioning, dismissal)
 * is reimplemented locally; overlays slide via CSS transitions on
 * measured row rects; size-context.tsx is the vendored size ladder.
 */`,
)

const FRAMEWORKS = [
  { value: 'next', label: 'Next.js' },
  { value: 'astro', label: 'Astro' },
  { value: 'remix', label: 'Remix' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'solidstart', label: 'SolidStart' },
  { value: 'qwik', label: 'Qwik City' },
  { value: 'analog', label: 'Analog' },
]

const TAGS = [
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'research', label: 'Research' },
  { value: 'ops', label: 'Ops' },
  { value: 'support', label: 'Support' },
]

const PROPS = [
  { name: 'items', type: '(string | {value,label})[]', def: '—', desc: 'The options; a string is its own value and label.' },
  { name: 'multiple', type: 'boolean', def: 'false', desc: 'Any number of picks; values become string[] — pair with ComboboxChips.' },
  { name: 'value', type: 'string | string[]', def: '—', desc: 'Selected value; "" means none, an array when multiple.' },
  { name: 'onValueChange', type: '(v) => void', def: '—', desc: 'Called with the pick, "" when cleared, or the array when multiple.' },
  { name: 'filter', type: '(item, query) => boolean', def: 'contains', desc: 'Match an item against the query. Default: case-insensitive contains on the label.' },
  { name: 'onCreate', type: '(query) => item | void', def: '—', desc: 'Adds a "Create …" row when no label matches exactly.' },
  { name: 'hideSelected', type: 'boolean', def: 'false', desc: 'Multiple only; picked items leave the list.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Disables the field and the popup.' },
  { name: 'size', type: '"default" | "compact"', def: 'SizeProvider', desc: 'Pins field and popup to one size step.' },
  { name: 'ComboboxInput variant', type: '"bordered" | "borderless"', def: '"bordered"', desc: 'Field frame. Also takes icon, placeholder, error, clearable.' },
]

export default function ComboboxDoc() {
  const [framework, setFramework] = useState('')
  const [teams, setTeams] = useState(['design'])

  const snippet = `import {
  Combobox, ComboboxInput, ComboboxContent,
  ComboboxList, ComboboxItem, ComboboxEmpty,
} from './combobox/combobox'

<Combobox items={frameworks} value={value} onValueChange={setValue}>
  <ComboboxInput placeholder="Select a framework" clearable />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item.value} value={item.value}>
          {item.label}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`

  return (
    <article className="doc">
      <DocHeader
        title="Combobox"
        tag="fluidfunctionalism"
        chip={`combobox/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Type-to-filter field with a keyboard highlight and a spring-animated
        list. Items are data, rows are yours. The highlight slides between
        rows; the picked row's marker glides to it; Enter always has a target.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — type to filter, arrows + Enter to pick
          </span>
          <div className="demo-col demo-form" style={{ width: 'min(360px, 100%)' }}>
            <div>
              <p className="demo-label">Framework</p>
              <Combobox
                items={FRAMEWORKS}
                value={framework}
                onValueChange={setFramework}
              >
                <ComboboxInput placeholder="Select a framework" clearable />
                <ComboboxContent>
                  <ComboboxEmpty>No framework found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.value} value={item.value}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div>
              <p className="demo-label">Teams (multiple)</p>
              <Combobox
                items={TAGS}
                multiple
                value={teams}
                onValueChange={setTeams}
              >
                <ComboboxChips placeholder="Add teams" clearable />
                <ComboboxContent>
                  <ComboboxEmpty>No team found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.value} value={item.value}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from fluidfunctionalism.com (Base UI flavor). The
            primitive's jobs are reimplemented in-file: case-insensitive
            filtering with a <code>filter</code> override, combobox/listbox
            ARIA (<code>role=combobox</code>,{' '}
            <code>aria-activedescendant</code>, focus stays in the input),
            arrow/Home/End highlight with first-row auto-highlight, Esc and
            outside-pointer dismissal, deferred unmount so the close tween
            plays, and a hidden form input for <code>name</code>. The popup
            anchors under the field inside the root's relative wrapper
            rather than a portal. The fluid hover and the selected-row
            marker are sliding overlays positioned from measured row rects;
            the check draws via <code>pathLength</code>.{' '}
            <code>size-context.tsx</code> is vendored — the{' '}
            <code>size</code> prop or a <code>SizeProvider</code> pins field
            and popup to one step.
          </>
        }
      >
        <SourceBrowser root="combobox" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.fluidfunctionalism.com/docs/combobox">
        fluidfunctionalism.com/docs/combobox
      </DocFooter>
    </article>
  )
}
