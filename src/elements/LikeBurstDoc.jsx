import { useState } from 'react'
import { LikeBurst } from './like-burst/like-burst'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'
import { Control, Switch } from '../components/controls.jsx'

import srcComponent from './like-burst/like-burst.tsx?raw'
import srcCss from './like-burst/like-burst.css?raw'

const FILES = [
  { path: 'like-burst.tsx', code: srcComponent },
  { path: 'like-burst.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `like-burst/${f.path}` })),
  `/*
 * like-burst — adapted from interior.dev, zero dependencies.
 * Original: https://www.interior.dev/docs/like-burst
 * useOptimisticLike is verbatim; sparks/roll are CSS keyframes.
 */`,
)

const PROPS = [
  { name: 'initialLiked', type: 'boolean', def: 'false', desc: 'Starting state before any server truth arrives.' },
  { name: 'initialCount', type: 'number', def: '0', desc: 'Displayed like count.' },
  { name: 'onCommit', type: '(liked, signal) => Promise', def: '—', desc: 'Called after the settle window with the final intent; abortable, and rollback is automatic on rejection.' },
  { name: 'onError', type: '(error) => void', def: '—', desc: 'Fires when onCommit rejects, after the UI rolls back.' },
  { name: 'onToggle', type: '(liked) => void', def: '—', desc: 'Fires on every tap with the new optimistic intent.' },
  { name: 'settle', type: 'number', def: '400', desc: 'Quiet window in ms — rapid taps collapse into one commit.' },
  { name: 'label / activeLabel', type: 'string', def: '"Like" / "Liked"', desc: 'Two label faces that crossfade.' },
  { name: 'format', type: '(n) => string', def: 'Intl.NumberFormat', desc: 'Count formatter — locale, compact notation, anything.' },
  { name: 'disabled', type: 'boolean', def: 'false', desc: 'Native disabled.' },
  { name: 'className', type: 'string', def: '""', desc: 'Appended last.' },
]

export default function LikeBurstDoc() {
  const [fail, setFail] = useState(false)
  const [log, setLog] = useState([])

  const snippet = `import { LikeBurst } from './like-burst/like-burst'

<LikeBurst
  initialLiked={false}
  initialCount={128}
  settle={400}
  onCommit={async (next, signal) => {
    const res = await fetch('/api/posts/42/like', {
      method: next ? 'POST' : 'DELETE',
      signal,
    })
    if (!res.ok) throw new Error('like failed')
  }}
  onError={() => toast('Could not save your like')}
/>`

  return (
    <article className="doc">
      <DocHeader
        title="Like Burst"
        tag="interior.dev"
        chip={`like-burst/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Optimistic like that survives rapid taps. Taps debounce into a single
        commit; a rejected commit rolls the UI back to server truth.
      </DocHeader>

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">preview — tap fast</span>
          <LikeBurst
            initialLiked={false}
            initialCount={128}
            onCommit={(next) =>
              new Promise((resolve, reject) =>
                setTimeout(() => {
                  setLog((l) => [`commit → ${next ? 'liked' : 'unliked'}${fail ? ' (rejected)' : ''}`, ...l].slice(0, 3))
                  fail ? reject(new Error('500')) : resolve()
                }, 500),
              )
            }
            onError={() => setLog((l) => ['rolled back', ...l].slice(0, 3))}
          />
          <span className="stage-size-note">
            {log.length ? log.join(' · ') : 'commit log appears here'}
          </span>
        </div>
        <div className="controls">
          <Control label="Server rejects">
            <Switch checked={fail} onChange={setFail} ariaLabel="Simulate server failure" />
          </Control>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from interior.dev — <code>useOptimisticLike</code> is
            verbatim: intent vs. server truth, AbortController per commit,
            sequence guards against stale resolutions. The spark burst and
            count roll are ported to CSS keyframes (the sparks replay via a{' '}
            <code>key=&#123;burst&#125;</code> remount — same trick upstream used).
          </>
        }
      >
        <SourceBrowser root="like-burst" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Props">
        <PropsTable props={PROPS} />
      </DocSection>

      <DocFooter href="https://www.interior.dev/docs/like-burst">
        interior.dev/docs/like-burst
      </DocFooter>
    </article>
  )
}
