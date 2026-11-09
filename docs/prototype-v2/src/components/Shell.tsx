import type { ReactNode } from 'react'

const links = [
  { href: '/admin/setup', label: 'Administrator', hint: 'Manage election terms, departments, positions and polls' },
  { href: '/vote', label: 'Voter', hint: 'Anonymous guest ballot' },
  { href: '/presentation', label: 'Presentation', hint: 'Room display' },
]

export default function Shell({ view, children }: { view: string; children: ReactNode }) {
  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/admin"><span className="brand-mark">CN</span><span>Church nominations<small>Poll workspace</small></span></a>
      <nav className="view-nav" aria-label="Prototype views">{links.map((link) => <a key={link.href} aria-current={view === link.href ? 'page' : undefined} href={link.href} title={link.hint}>{link.label}</a>)}</nav>
      <span className="prototype-tag">Prototype</span>
    </header>
    <main className="page-content">{children}</main>
    <footer className="footer-note">Standalone simulation · Browser-local data · No backend connection</footer>
  </div>
}