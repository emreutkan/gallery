import CopyButton from './CopyButton.jsx'

const STRING = `"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\``
const COMMENT = `\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*`
const NUMBER = `\\b\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b`

const JSX_TOKEN = new RegExp(
  `(${COMMENT})|(${STRING})|(\\bimport\\b|\\bfrom\\b|\\bexport\\b|\\bdefault\\b|\\bconst\\b|\\blet\\b|\\breturn\\b|\\bfunction\\b)|(<\\/?[A-Za-z][\\w.]*|\\/?>)|(\\b[a-zA-Z_$][\\w$]*(?==))`,
  'g',
)

const TS_TOKEN = new RegExp(
  `(${COMMENT})|(${STRING})|(\\b(?:import|export|from|type|interface|const|let|var|function|return|for|of|in|if|else|while|new|typeof|as|extends|readonly|keyof|number|string|boolean|void|null|undefined|true|false|this|default)\\b)|(${NUMBER})|(\\b[A-Z][A-Za-z0-9_]*\\b)`,
  'g',
)

function highlight(code, lang) {
  const TOKEN = lang === 'ts' ? TS_TOKEN : JSX_TOKEN
  const out = []
  let last = 0
  let m
  let key = 0
  while ((m = TOKEN.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index))
    const cls =
      lang === 'ts'
        ? m[1] ? 'tok-com' : m[2] ? 'tok-str' : m[3] ? 'tok-kw' : m[4] ? 'tok-num' : 'tok-attr'
        : m[1] ? 'tok-com' : m[2] ? 'tok-str' : m[3] ? 'tok-kw' : m[4] ? 'tok-tag' : 'tok-attr'
    out.push(
      <span key={key++} className={cls}>
        {m[0]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

export default function CodeBlock({ code, title = 'usage.tsx', copyLabel, lang = 'jsx' }) {
  return (
    <div className="codewrap">
      <div className="codewrap-head">
        <span className="codewrap-title">{title}</span>
        <CopyButton text={code} label={copyLabel} />
      </div>
      <pre className="code">
        <code>{highlight(code, lang)}</code>
      </pre>
    </div>
  )
}

export { highlight }
