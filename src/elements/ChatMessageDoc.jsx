import { useEffect, useMemo, useState } from 'react'
import { ChatMessage } from './chat-message/chat-message'
import { SizeProvider } from './chat-message/size-context'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './chat-message/chat-message.tsx?raw'
import srcThumb from './chat-message/file-thumbnail.tsx?raw'
import srcSize from './chat-message/size-context.tsx?raw'
import srcCss from './chat-message/chat-message.css?raw'

const FILES = [
  { path: 'chat-message.tsx', code: srcComponent },
  { path: 'file-thumbnail.tsx', code: srcThumb },
  { path: 'size-context.tsx', code: srcSize },
  { path: 'chat-message.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `chat-message/${f.path}` })),
  `/*
 * chat-message — adapted from fluidfunctionalism.com, zero dependencies.
 * Original: https://www.fluidfunctionalism.com/docs/chat-message
 * framer-motion → CSS entrance keyframe; pdfjs-dist → generic glyph
 * fallback for non-image attachments; Tailwind → chat-message.css.
 * size-context.tsx is the vendored size ladder.
 */`,
)

const CopyGlyph = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
)
const RetryGlyph = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
)

const actions = (
  <>
    <button type="button" aria-label="Copy"><CopyGlyph /></button>
    <button type="button" aria-label="Retry"><RetryGlyph /></button>
  </>
)

// A real File so the thumbnail path is genuine — canvas → blob → File.
function useSampleImage() {
  const [file, setFile] = useState(null)
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 160
    const g = c.getContext('2d')
    const grad = g.createLinearGradient(0, 0, 160, 160)
    grad.addColorStop(0, '#4568ff')
    grad.addColorStop(1, '#93b0ff')
    g.fillStyle = grad
    g.fillRect(0, 0, 160, 160)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.beginPath()
    g.arc(80, 80, 34, 0, Math.PI * 2)
    g.fill()
    c.toBlob((b) => {
      if (b) setFile(new File([b], 'gradient.png', { type: 'image/png' }))
    }, 'image/png')
  }, [])
  return file
}

const PROPS = [
  { name: 'from', type: '"user" | "assistant"', def: '—', desc: 'User is a right-aligned accent bubble; assistant is left-aligned plain text.' },
  { name: 'children', type: 'ReactNode', def: '—', desc: 'Message body. Omit for an attachment-only message.' },
  { name: 'time', type: 'ReactNode', def: '—', desc: 'Pre-formatted timestamp in the hover-revealed meta row. User messages only.' },
  { name: 'actions', type: 'ReactNode', def: '—', desc: 'Icon-only buttons next to the timestamp; row height is always reserved.' },
  { name: 'files', type: 'File[]', def: '—', desc: 'Attachments as square thumbnails above the bubble.' },
  { name: 'thumbnailSize', type: 'number', def: '64', desc: 'Thumbnail side length in px.' },
  { name: 'size', type: '"default" | "compact"', def: 'SizeProvider', desc: 'Pins the message to one step of the size ladder.' },
  { name: 'className', type: 'string', def: '—', desc: 'Merged onto the outer wrapper, e.g. to tweak max-width.' },
]

export default function ChatMessageDoc() {
  const [replayKey, setReplayKey] = useState(0)
  const [compact, setCompact] = useState(false)
  const image = useSampleImage()
  const pdf = useMemo(
    () => new File([new Uint8Array([37, 80, 68, 70])], 'brief.pdf', { type: 'application/pdf' }),
    [],
  )

  const snippet = `import { ChatMessage } from './chat-message/chat-message'

const actions = <button aria-label="Copy"><CopyIcon /></button>

<div className="flex flex-col gap-2">
  <ChatMessage from="user" time="Wednesday 6:06 PM" actions={actions}>
    What does "good design" actually mean?
  </ChatMessage>
  <ChatMessage from="assistant" actions={actions}>
    Good design is mostly invisible. You only notice it when it is missing.
  </ChatMessage>
</div>`

  return (
    <article className="doc">
      <DocHeader
        title="Chat Message"
        tag="fluidfunctionalism"
        chip={`chat-message/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Transcript bubble with baked-in entrance motion, user/assistant
        alignment, a hover-revealed meta row, and file attachments. Hover a
        message to reveal its timestamp and actions — on touch the row stays
        visible.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            preview — hover a bubble to reveal its meta row
          </span>
          <div className="demo-card" style={{ width: 'min(520px, 100%)' }}>
            <SizeProvider size={compact ? 'compact' : 'default'}>
              <div key={replayKey} className="cm-demo-thread">
                <ChatMessage from="user" time="Wednesday 6:06 PM" actions={actions}>
                  What does &quot;good design&quot; actually mean?
                </ChatMessage>
                <ChatMessage from="assistant" actions={actions}>
                  Good design is mostly invisible. You only notice it when it
                  is missing.
                </ChatMessage>
                <ChatMessage
                  from="user"
                  time="Wednesday 6:07 PM"
                  actions={actions}
                  files={pdf ? [pdf] : []}
                >
                  Here&apos;s the brief I mentioned.
                </ChatMessage>
                {image && (
                  <ChatMessage
                    from="user"
                    time="Wednesday 6:08 PM"
                    actions={actions}
                    files={[image]}
                  />
                )}
                <ChatMessage from="assistant" actions={actions}>
                  Got it — reviewing the attachment now.
                </ChatMessage>
              </div>
            </SizeProvider>
          </div>
          <div className="sb-controls">
            <label>
              size
              <select value={compact ? 'compact' : 'default'} onChange={(e) => setCompact(e.target.value === 'compact')}>
                <option value="default">default</option>
                <option value="compact">compact</option>
              </select>
            </label>
            <button
              type="button"
              className="cm-replay"
              onClick={() => setReplayKey((k) => k + 1)}
            >
              replay entrance
            </button>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from fluidfunctionalism.com. Upstream's{' '}
            <code>motion.div</code> entrance (fade + 8px rise + 96% scale from
            the tail corner) is a CSS keyframe on mount — same{' '}
            <code>spring.moderate</code> feel. <code>FileThumbnail</code> is
            vendored with its StrictMode-safe object-URL effect verbatim; the
            lazy <code>pdfjs-dist</code> first-page render is replaced by the
            generic glyph + PDF badge so the component stays zero-dep. The
            meta row always reserves its height and reveals on hover or
            action-focus; <code>pointer:coarse</code> keeps it visible. The{' '}
            <code>text-pretty</code> asymmetry is preserved: user bubbles
            pretty-wrap, assistant replies don't — so streamed text never
            reflows earlier words.
          </>
        }
      >
        <SourceBrowser root="chat-message" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.fluidfunctionalism.com/docs/chat-message">
        fluidfunctionalism.com/docs/chat-message
      </DocFooter>
    </article>
  )
}
