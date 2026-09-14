import { useState } from 'react'
import { highlight } from './CodeBlock.jsx'
import CopyButton from './CopyButton.jsx'

export function buildCopyAll(files, header) {
  const body = files
    .map(
      (f) =>
        `/* ── file: ${f.path} ${'─'.repeat(Math.max(2, 62 - f.path.length))} */\n\n${f.code.trimEnd()}`,
    )
    .join('\n\n')
  return `${header}\n\n${body}`
}

export default function SourceBrowser({ root, files, all, defaultFile }) {
  const [file, setFile] = useState(defaultFile ?? files[0]?.path)
  const current = files.find((f) => f.path === file) ?? files[0]
  const single = files.length === 1

  return (
    <div className="srcwrap">
      <div className="srcwrap-head">
        <span className="srcwrap-title">
          {root}/{current.path}
        </span>
        <CopyButton text={current.code} label="Copy file" />
        <CopyButton text={all} label="Copy all" />
      </div>
      <div className={`srcwrap-body${single ? ' single' : ''}`}>
        {!single && (
          <div className="src-files" role="tablist" aria-label="Source files">
            {files.map((f, i) => {
              const showDir = f.dir && (i === 0 || files[i - 1].dir !== f.dir)
              return (
                <span key={f.path}>
                  {showDir && <span className="src-dir">{f.dir}</span>}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={file === f.path}
                    className={`src-file${file === f.path ? ' on' : ''}${f.dir ? ' child' : ''}`}
                    onClick={() => setFile(f.path)}
                  >
                    {f.dir ? f.path.replace(/^[^/]+\//, '') : f.path}
                  </button>
                </span>
              )
            })}
          </div>
        )}
        <pre className="src-code">
          <code>{highlight(current.code, 'ts')}</code>
        </pre>
      </div>
    </div>
  )
}
