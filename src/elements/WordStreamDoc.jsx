import { useState } from 'react'
import { WordStream } from './word-stream/word-stream'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './word-stream/word-stream.jsx?raw'

const FILES = [{ path: 'word-stream.jsx', code: srcComponent }]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `word-stream/${f.path}` })),
  `/*
 * word-stream — from transitions.dev, self-contained.
 * Original: https://transitions.dev
 * Styles auto-inject on import (SSR-safe, idempotent). Upstream
 * ships CSS + the recipe only; the React half wraps words in
 * .t-stream-w spans and adds .is-in word-by-word every --stream-gap.
 * Change \`text\` (or remount) to replay the stream.
 */`,
)

const PROPS = [
  { name: 'text', type: 'string', def: '—', desc: 'Content to stream. Words reveal in order; whitespace is preserved. Changing it restarts the stream.' },
  { name: 'gap', type: 'number (ms)', def: '60', desc: 'Delay between words — mirrors --stream-gap.' },
  { name: 'className / style', type: 'string / CSSProperties', def: '—', desc: 'Passthrough onto the .t-stream wrapper.' },
]

const DEMO_TEXT =
  'The agent finished the migration, ran the suite, and opened a draft pull request. Forty-one files changed, zero conflicts, and the changelog wrote itself while you were reading this sentence.'

export default function WordStreamDoc() {
  const [text, setText] = useState(DEMO_TEXT)
  const [gap, setGap] = useState(60)
  const [nonce, setNonce] = useState(0)

  const snippet = `import { WordStream } from './word-stream/word-stream'

// For LLM-style streaming, feed it the accumulated text —
// already-revealed words stay put, new words fade in.
<WordStream text={accumulated} gap={40} />

// Tune via CSS vars: --stream-fade, --stream-blur, --stream-ease.`

  return (
    <article className="doc">
      <DocHeader
        title="Word Stream"
        tag="transitions.dev"
        chip={`word-stream/ · ${FILES.length} file · self-contained · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Per-word streaming: each word resolves through opacity plus a
        whisper of blur, one every 60ms — the cadence of text arriving
        from a model. Sibling to interior.dev's Streaming Text, which
        reveals by token rather than by word.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — words fade in one at a time; edit the text or lower the gap
          </span>
          <div className="demo-card ws-demo-card">
            <WordStream key={nonce} text={text} gap={gap} className="ws-demo-text" />
          </div>
          <div className="sb-controls">
            <label>
              gap
              <select value={gap} onChange={(e) => setGap(Number(e.target.value))}>
                <option value={20}>20ms — rapid</option>
                <option value={60}>60ms — default</option>
                <option value={120}>120ms — deliberate</option>
              </select>
            </label>
            <button type="button" className="sb-replay" onClick={() => setNonce((n) => n + 1)}>
              Replay
            </button>
          </div>
          <div className="sb-controls">
            <label style={{ flex: 1 }}>
              text
              <input value={text} onChange={(e) => setText(e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.jsx" />

      <DocSection
        title="Source"
        desc={
          <>
            From transitions.dev — CSS verbatim, with the React half the
            recipe describes: words render as <code>.t-stream-w</code>{' '}
            spans and receive <code>.is-in</code> one by one every{' '}
            <code>--stream-gap</code>, each resolving through opacity + a
            1px blur over <code>--stream-fade</code>. Upstream's
            imperative replay ("wipe every span, force reflow, restore,
            re-add") maps to what React already does — change{' '}
            <code>text</code> or remount and the fresh spans stream again.
            Whitespace tokens pass through untouched so spacing and
            newlines survive.
          </>
        }
      >
        <SourceBrowser root="word-stream" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://transitions.dev">transitions.dev</DocFooter>
    </article>
  )
}
