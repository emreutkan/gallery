import { useState } from 'react'
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarInset, SidebarTrigger,
  SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarFooter,
  SidebarSeparator, SidebarGroupAction,
} from './sidebar/sidebar'
import {
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge,
  SidebarMenuAction, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
} from './sidebar/sidebar-menu'
import CodeBlock from '../components/CodeBlock.jsx'
import SourceBrowser, { buildCopyAll } from '../components/SourceBrowser.jsx'
import { DocHeader, DocSection, PropsTable, DocFooter } from '../components/doc.jsx'

import srcComponent from './sidebar/sidebar.tsx?raw'
import srcMenu from './sidebar/sidebar-menu.tsx?raw'
import srcSize from './sidebar/size-context.tsx?raw'
import srcCss from './sidebar/sidebar.css?raw'

const FILES = [
  { path: 'sidebar.tsx', code: srcComponent },
  { path: 'sidebar-menu.tsx', code: srcMenu },
  { path: 'size-context.tsx', code: srcSize },
  { path: 'sidebar.css', code: srcCss },
]

const ALL_SOURCE = buildCopyAll(
  FILES.map((f) => ({ ...f, path: `sidebar/${f.path}` })),
  `/*
 * sidebar — adapted from fluidfunctionalism.com, zero dependencies.
 * Original: https://www.fluidfunctionalism.com/docs/sidebar
 * @base-ui/react Dialog → SidebarSheet (Esc/outside/scroll-lock/focus
 * restore); framer-motion → CSS transitions on width/translate/opacity;
 * cva/lucide → plain classes + inline SVG; Tailwind → sidebar.css.
 * sidebar-menu.tsx holds the menu family; size-context.tsx is the
 * vendored size ladder.
 */`,
)

const I = ({ size = 16, strokeWidth = 1.5, className, d }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={className}
  >
    {d}
  </svg>
)

const HomeIcon = (p) => <I {...p} d={<path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />} />
const InboxIcon = (p) => <I {...p} d={<><path d="M22 12h-5l-2 3h-6l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" /></>} />
const CalIcon = (p) => <I {...p} d={<><rect x="3" y="4" width="18" height="17" rx="2.5" /><path d="M8 2v4M16 2v4M3 9h18" /></>} />
const GearIcon = (p) => <I {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>} />
const DocIcon = (p) => <I {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></>} />
const PlusIcon = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
const DotsIcon = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>

const PROVIDER_PROPS = [
  { name: 'defaultOpen', type: 'boolean', def: 'true', desc: 'Uncontrolled initial state.' },
  { name: 'open / onOpenChange', type: 'boolean / (open) => void', def: '—', desc: 'Controlled open state.' },
  { name: 'persist', type: 'boolean', def: 'true', desc: 'Writes desktop state to the sidebar_state cookie.' },
  { name: 'peek', type: '"none" | "hover" | "click"', def: '"none"', desc: 'Collapsed edge strip reveals the sidebar as a floating overlay.' },
  { name: 'shortcut', type: 'string | null', def: '"[" / "]"', desc: 'Bare-key toggle — [ for left, ] for right; null disables.' },
  { name: 'mobileBreakpoint', type: 'number', def: '768', desc: 'Width below which the sidebar becomes a modal drawer.' },
  { name: 'width / widthMobile', type: 'string', def: '"16rem" / "18rem"', desc: 'Rail and drawer widths.' },
]

const SIDEBAR_PROPS = [
  { name: 'side', type: '"left" | "right"', def: '"left"', desc: 'Which edge the rail lives on.' },
  { name: 'variant', type: '"sidebar" | "floating" | "inset"', def: '"sidebar"', desc: 'Transparent rail, floating card, or inset pairing where SidebarInset becomes the card.' },
  { name: 'collapsible', type: '"offcanvas" | "none"', def: '"offcanvas"', desc: 'Offcanvas slides away; none is a static column.' },
  { name: 'rail', type: 'boolean', def: 'true', desc: 'Drag-resize handle — drag to resize (160–360px), pull past min to collapse, click to toggle.' },
  { name: 'bordered', type: 'boolean', def: 'true', desc: 'Edge hairline on the sidebar variant.' },
]

function DemoTree({ active, onPick }) {
  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={false} size="lg" style={{ pointerEvents: 'none' }}>
              <span style={{ fontWeight: 650, fontSize: 13 }}>Acme Inc</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton icon={HomeIcon} isActive={active === 'home'} onClick={() => onPick('home')}>
                Home
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton icon={InboxIcon} isActive={active === 'inbox'} onClick={() => onPick('inbox')}>
                Inbox
              </SidebarMenuButton>
              <SidebarMenuBadge>4</SidebarMenuBadge>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton icon={CalIcon} isActive={active === 'cal'} onClick={() => onPick('cal')}>
                Calendar
              </SidebarMenuButton>
              <SidebarMenuAction aria-label="More">
                <DotsIcon />
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup collapsible>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Add project">
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton status="active" isActive={active === 'apollo'} onClick={() => onPick('apollo')}>
                Apollo
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton status="unread" isActive={active === 'boreal'} onClick={() => onPick('boreal')}>
                Boreal
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton status="idle" isActive={active === 'cinder'} onClick={() => onPick('cinder')}>
                Cinder
              </SidebarMenuButton>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton isActive={active === 'cinder-docs'} onClick={() => onPick('cinder-docs')}>
                    Docs
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton isActive={active === 'cinder-api'} onClick={() => onPick('cinder-api')}>
                    API
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton icon={GearIcon} isActive={active === 'settings'} onClick={() => onPick('settings')}>
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}

export default function SidebarDoc() {
  const [variant, setVariant] = useState('sidebar')
  const [side, setSide] = useState('left')
  const [peek, setPeek] = useState('none')
  const [collapsible, setCollapsible] = useState('offcanvas')
  const [active, setActive] = useState('home')
  const [mobileActive, setMobileActive] = useState('home')

  const snippet = `import {
  SidebarProvider, Sidebar, SidebarContent, SidebarInset, SidebarTrigger,
  SidebarGroup, SidebarGroupLabel,
} from './sidebar/sidebar'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './sidebar/sidebar-menu'

<SidebarProvider defaultOpen>
  <Sidebar side="left" variant="sidebar">
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton icon={Home} isActive>Home</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton icon={Inbox}>Inbox</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset>
    <SidebarTrigger />
    {/* page content */}
  </SidebarInset>
</SidebarProvider>`

  return (
    <article className="doc">
      <DocHeader
        title="Sidebar"
        tag="fluidfunctionalism"
        chip={`sidebar/ · ${FILES.length} files · zero deps · no npm install`}
        copyAll={ALL_SOURCE}
      >
        Composable app shell with offcanvas collapse, a drag-resize rail, a
        collapsed-peek overlay, and a mobile drawer. The rail is also the
        click toggle; the bare-key shortcut is <code>[</code> (left) or{' '}
        <code>]</code> (right).
      </DocHeader>

      <div className="plate">
        <div className="stage sb-stage">
          <span className="stage-caption">
            preview — trigger, rail drag/click, or press{' '}
            <kbd>{side === 'right' ? ']' : '['}</kbd>
          </span>
          <div className="sb-frame">
            <SidebarProvider
              key={`${side}-${peek}-${collapsible}`}
              defaultOpen
              persist={false}
              peek={peek}
              mobileBreakpoint={0}
            >
              <Sidebar side={side} variant={variant} collapsible={collapsible}>
                <DemoTree active={active} onPick={setActive} />
              </Sidebar>
              <SidebarInset>
                <div className="sb-demo-page">
                  <SidebarTrigger />
                  <div className="sb-demo-body">
                    <h3 className="sb-demo-h">{active}</h3>
                    <p className="sb-demo-p">
                      The inset is the live page region — it reflows as the
                      column animates.
                    </p>
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
          <div className="sb-controls">
            <label>
              variant
              <select value={variant} onChange={(e) => setVariant(e.target.value)}>
                <option>sidebar</option>
                <option>floating</option>
                <option>inset</option>
              </select>
            </label>
            <label>
              side
              <select value={side} onChange={(e) => setSide(e.target.value)}>
                <option>left</option>
                <option>right</option>
              </select>
            </label>
            <label>
              collapsible
              <select value={collapsible} onChange={(e) => setCollapsible(e.target.value)}>
                <option>offcanvas</option>
                <option>none</option>
              </select>
            </label>
            <label>
              peek
              <select value={peek} onChange={(e) => setPeek(e.target.value)}>
                <option>none</option>
                <option>hover</option>
                <option>click</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <CodeBlock code={snippet} title="usage.tsx" />

      <div className="plate">
        <div className="stage">
          <span className="stage-caption">
            mobile — provider forced below its breakpoint; the trigger opens a drawer
          </span>
          <div className="sb-frame sb-frame-mobile">
            <SidebarProvider defaultOpen persist={false} mobileBreakpoint={99999}>
              <Sidebar side="left" variant="sidebar">
                <DemoTree active={mobileActive} onPick={setMobileActive} />
              </Sidebar>
              <SidebarInset>
                <div className="sb-demo-page">
                  <SidebarTrigger />
                  <div className="sb-demo-body">
                    <h3 className="sb-demo-h">Drawer</h3>
                    <p className="sb-demo-p">
                      Esc, the scrim, or re-toggling closes it; focus returns to the trigger.
                    </p>
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </div>
      </div>

      <DocSection
        title="Source"
        desc={
          <>
            Adapted from fluidfunctionalism.com (Base UI flavor, ~120KB across
            three files). Upstream's <code>Dialog</code> primitive becomes{' '}
            <code>SidebarSheet</code> — a deferred-unmount drawer with scroll
            lock, Esc/outside dismissal and focus restore. The framer-motion
            shell choreography is a width transition on the in-flow column
            (that's what reflows the inset) plus a translate on the
            fixed-width panel inside it — same offcanvas feel, no motion lib.
            Rail drag keeps upstream's exact mechanics: 4px dead zone,
            160–360px clamp, 56px collapse slop, click-to-toggle.{' '}
            <code>sidebar-menu.tsx</code> ports the menu family — fluid
            hover/active overlays slide via measured row rects, and the
            ghost-span label keeps the <code>fontVariationSettings</code>{' '}
            weight animation (inert on non-variable fonts).
          </>
        }
      >
        <SourceBrowser root="sidebar" files={FILES} all={ALL_SOURCE} />
      </DocSection>

      <DocSection title="Provider props">
        <PropsTable props={PROVIDER_PROPS} />
      </DocSection>
      <DocSection title="Sidebar props">
        <PropsTable props={SIDEBAR_PROPS} />
      </DocSection>

      <DocFooter href="https://www.fluidfunctionalism.com/docs/sidebar">
        fluidfunctionalism.com/docs/sidebar
      </DocFooter>
    </article>
  )
}
