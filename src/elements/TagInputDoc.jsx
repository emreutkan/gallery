import { useState } from 'react'
import { TagInput } from './tag-input/tag-input'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './tag-input/tag-input.tsx?raw'
import srcCss from './tag-input/tag-input.css?raw'

const FILES = [
  { path: 'tag-input.tsx', code: srcComponent },
  { path: 'tag-input.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `tag-input/${f.path}` })),
  `/*
 * tag-input — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/tag-input
 * useTagInput is verbatim; chip motion is FLIP + CSS, no motion package.
 */`,
)

const PROPS = [
  { name: 'value', type: 'string[]', def: '—', desc: 'Controlled list of tags. Omit to let the component own its state.' },
  { name: 'defaultValue', type: 'string[]', def: '[]', desc: 'Initial list when uncontrolled.' },
  { name: 'onChange', type: '(tags) => void', def: '—', desc: 'Fires once per committed change, never per keystroke.' },
  { name: 'max', type: 'number', def: '—', desc: 'Hard ceiling. Reaching it shows the limit message and reveals a counter whose width is reserved.' },
  { name: 'separators', type: 'string[]', def: '[","]', desc: 'Characters that commit the draft and split pasted text. Enter always commits; newlines and tabs always split.' },
  { name: 'allowDuplicates', type: 'boolean', def: 'false', desc: 'When false, a repeat is refused and the tag already holding that value flashes instead.' },
  { name: 'validate', type: '(candidate, tags) => boolean', def: '—', desc: 'Runs on the trimmed, whitespace-collapsed candidate before it is added.' },
  { name: 'label', type: 'string', def: '—', desc: 'Rendered as a real label bound to the input; without it the input falls back to aria-label.' },
  { name: 'placeholder', type: 'string', def: '"Add a tag"', desc: 'Placeholder for the draft field.' },
  { name: 'hint', type: 'string', def: '"Enter adds · Backspace removes"', desc: 'Persistent description via aria-describedby. Rejections crossfade over it in the same grid cell.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last to the wrapper so callers win.' },
]

export default function TagInputDoc() {
  const [topics, setTopics] = useState(['motion'])

  const snippet = `import { TagInput } from './tag-input/tag-input'

const [topics, setTopics] = useState(['motion'])

<TagInput
  label="Topics"
  value={topics}
  onChange={setTopics}
  max={6}
  separators={[',', ';']}
  validate={(candidate) => candidate.length <= 24}
  hint="Enter adds · Backspace highlights, then removes"
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Tag Input"
        tag="interior.dev"
        chip={`tag-input/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Enter adds, backspace highlights then removes. Chips slide as the list
        reflows, duplicates light up the tag you already have, and paste splits
        on separators. Arrow keys walk the armed selection.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — try &ldquo;motion&rdquo; again, or paste &ldquo;a, b, c&rdquo;
          </span>
          <form className="demo-col demo-form" onSubmit={(e) => e.preventDefault()}>
            <TagInput
              label="Topics"
              value={topics}
              onChange={setTopics}
              max={6}
              separators={[',', ';']}
              validate={(candidate) => candidate.length <= 24}
              hint="Enter adds · Backspace highlights, then removes"
            />
            <button
              type="submit"
              className="demo-submit"
              disabled={topics.length === 0}
            >
              Save segment
            </button>
          </form>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useTagInput</code> is verbatim:
            armed-state backspace, separator splitting, duplicate flashing,
            rejection messages, and the announcement queue all live in the
            hook. The motion port is a FLIP pass in the component — chip
            positions are measured each render, movers get an inverted
            transform via the Web Animations API, and removed chips leave a
            190ms ghost where they sat.
          </>
        }
      >
        <SourceBrowser root="tag-input" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/tag-input">
        interior.dev/docs/tag-input
      </DocFooter>
    </article>
  )
}
