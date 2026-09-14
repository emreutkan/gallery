import { useCallback, useEffect, useState } from 'react'
import { ALL_ELEMENTS, CATEGORIES } from './registry.jsx'
import { MenuIcon, MoonIcon, SunIcon } from './components/icons.jsx'

function parseHash() {
  const m = window.location.hash.match(/^#\/([\w-]+)\/([\w-]+)/)
  return m ? { category: m[1], element: m[2] } : null
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const forced = new URLSearchParams(window.location.search).get('theme')
    if (forced === 'dark' || forced === 'light') return forced === 'dark'
    return (
      localStorage.getItem('ui-elements-theme') === 'dark' ||
      (!localStorage.getItem('ui-elements-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    )
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem('ui-elements-theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

export default function App() {
  const [route, setRoute] = useState(parseHash)
  const [dark, setDark] = useDarkMode()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash())
      setNavOpen(false)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const current =
    ALL_ELEMENTS.find(
      (e) => e.category === route?.category && e.id === route?.element,
    ) || ALL_ELEMENTS[0]

  const select = useCallback((category, id) => {
    window.location.hash = `/${category}/${id}`
    setNavOpen(false)
  }, [])

  const Doc = current.Doc

  return (
    <div className="shell">
      <header className="topbar">
        <button
          type="button"
          className="menu-btn"
          aria-label="Open navigation"
          onClick={() => setNavOpen((v) => !v)}
        >
          <MenuIcon />
        </button>
        <a className="brand" href="#/ai-agents/thinking-orb">
          <span className="brand-mark">&lt;/&gt;</span>
          UI Elements
        </a>
        <div className="topbar-right">
          <span className="element-count">
            {ALL_ELEMENTS.length} element{ALL_ELEMENTS.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className="copy-btn"
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {navOpen && (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <nav className={`sidebar${navOpen ? ' open' : ''}`} aria-label="Components">
        {CATEGORIES.map((cat) => (
          <div className="side-category" key={cat.id}>
            <h2 className="side-category-label">{cat.name}</h2>
            {cat.elements.map((el) => (
              <button
                key={el.id}
                type="button"
                className={`side-link${el.id === current.id ? ' active' : ''}`}
                onClick={() => select(cat.id, el.id)}
              >
                {el.name}
                <span className="pkg">{el.pkg}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <main className="main">
        <Doc key={current.id} />
      </main>
    </div>
  )
}
