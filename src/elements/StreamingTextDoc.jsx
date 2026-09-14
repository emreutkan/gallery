import { useState } from 'react'
import { StreamingText } from './streaming-text/streaming-text'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Segmented } from '../components/controls.jsx'

import srcComponent from './streaming-text/streaming-text.tsx?raw'
import srcCss from './streaming-text/streaming-text.css?raw'

const FILES = [
  { path: 'streaming-text.tsx', code: srcComponent },
  { path: 'streaming-text.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `streaming-text/${f.path}` })),
  `/*
 * streaming-text — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/streaming-text
 * The rAF accumulator is verbatim; caret and Skip/Replay swap are CSS.
 */`,
)

const REPLY =
  'The invoice failed because the card on file expired on the third, so the retry schedule kept charging a dead account. I paused it. Update the card and the charge re-runs tonight.'

const PROPS = [
  { name: 'text', type: 'string', def: '—', desc: 'The full string to stream. Changing it restarts the stream from the first token.' },
  { name: 'tokensPerSecond', type: 'number', def: '18', desc: 'Reveal rate in words/sec. Time is accumulated, not frame-counted, so the rate holds on a slow display.' },
  { name: 'autoStart', type: 'boolean', def: 'true', desc: 'When false it sits at zero tokens with a blinking caret until start() is called.' },
  { name: 'showSkip', type: 'boolean', def: 'true', desc: 'Renders the keyboard-reachable skip control. Its row exists in every state.' },
  { name: 'label', type: 'string', def: '"Streamed response"', desc: "Accessible name for the group and the basis of the skip button's label." },
  { name: 'onDone', type: '() => void', def: '—', desc: 'Fires once when the last token lands — including when reduced motion skips the stream.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last on the root, which carries the type styles.' },
  { name: 'useStreamingText', type: '(opts) => state', def: '—', desc: 'visible, status, start/pause/skip/reset — for drawing your own stream chrome.' },
]

export default function StreamingTextDoc() {
  const [settled, setSettled] = useState(false)
  const [rate, setRate] = useState(18)
  const [round, setRound] = useState(0)

  const snippet = `import { StreamingText } from './streaming-text/streaming-text'

<StreamingText
  text={reply}
  tokensPerSecond={${rate}}
  label="Assistant reply"
  onDone={() => setSettled(true)}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Streaming Text"
        tag="interior.dev"
        chip={`streaming-text/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Token by token with a caret. An invisible copy of the full text holds
        the layout, so nothing reflows as words land; the caret blinks while
        paused and fades when the stream is done.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — Skip finishes, then Replay</span>
          <article className="demo-card">
            <StreamingText
              key={round}
              text={REPLY}
              tokensPerSecond={rate}
              label="Assistant reply"
              onDone={() => setSettled(true)}
            />
            <div className="demo-card-acts">
              <button type="button" className="demo-chip" disabled={!settled}>
                Copy
              </button>
              <button type="button" className="demo-chip" disabled={!settled}>
                Regenerate
              </button>
            </div>
          </article>
        </div>
        <div className="controls">
          <Control label="Rate">
            <Segmented
              options={[8, 18, 40]}
              value={rate}
              onChange={(v) => {
                setRate(v)
                setSettled(false)
                setRound((r) => r + 1)
              }}
              ariaLabel="Tokens per second"
            />
          </Control>
          <button
            type="button"
            className="demo-submit"
            onClick={() => {
              setSettled(false)
              setRound((r) => r + 1)
            }}
          >
            Restart
          </button>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — the accumulator is verbatim: a
            requestAnimationFrame loop carries leftover milliseconds between
            frames, so the rate is true even when the display drops frames.
            Reduced motion finishes instantly but still fires{' '}
            <code>onDone</code>. Caret blink and the Skip&harr;Replay label
            swap are CSS.
          </>
        }
      >
        <SourceBrowser root="streaming-text" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/streaming-text">
        interior.dev/docs/streaming-text
      </DocFooter>
    </article>
  )
}
