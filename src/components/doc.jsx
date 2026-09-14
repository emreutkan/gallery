import CopyButton from './CopyButton.jsx'

export function DocHeader({ title, tag, children, chip, copyAll }) {
  return (
    <header className="doc-head">
      <div className="doc-title-row">
        <h1 className="doc-title">{title}</h1>
        {tag && <span className="pkg-tag">{tag}</span>}
      </div>
      <p className="doc-desc">{children}</p>
      <div className="install-row">
        <code className="install-chip">{chip}</code>
        {copyAll && <CopyButton text={copyAll} label="Copy all source" />}
      </div>
    </header>
  )
}

export function DocSection({ title, children, desc }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      {desc && <p className="section-desc">{desc}</p>}
      {children}
    </section>
  )
}

export function PropsTable({ props }) {
  return (
    <div className="table-scroll">
      <table className="props-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>
                <span className="type">{p.type}</span>
              </td>
              <td>
                <code className="def">{p.def}</code>
              </td>
              <td>{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DocFooter({ href, children }) {
  return (
    <footer className="foot">
      <span>
        Source:{' '}
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      </span>
      <span>Adapted to zero dependencies</span>
    </footer>
  )
}
