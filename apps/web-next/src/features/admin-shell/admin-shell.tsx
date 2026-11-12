import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import type { ViewingContextSelection } from '../../data/mock-admin-context'
import { Button } from '../../components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet'
import { ApplicationNavigation } from './components/application-navigation'
import { ViewingContext } from './components/viewing-context'

interface AdminShellProps {
  viewingContext: ViewingContextSelection
  onViewingContextChange: (selection: ViewingContextSelection) => void
}

export function AdminShell({
  viewingContext,
  onViewingContextChange,
}: AdminShellProps) {
  const [navigationOpen, setNavigationOpen] = useState(false)

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside className="app-sidebar" aria-label="Application sidebar">
        <div className="sidebar-brand">
          <Link className="brand-name" to="/admin" aria-label="Church nominations home">
            Church nominations
          </Link>
          <p>Administration</p>
        </div>
        <ApplicationNavigation />
        <p className="sidebar-note">Application destinations only</p>
      </aside>

      <div className="workspace-column">
        <header className="mobile-header" role="banner">
          <Link className="brand-name" to="/admin" aria-label="Church nominations home">
            Church nominations
          </Link>
          <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  className="mobile-navigation-trigger"
                  variant="outline"
                  aria-label="Open navigation"
                />
              }
            >
              <Menu aria-hidden="true" focusable="false" />
              <span>Open navigation</span>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="navigation-sheet"
              aria-hidden={!navigationOpen}
              inert={!navigationOpen}
            >
              <SheetHeader className="navigation-sheet-header">
                <SheetTitle>Church nominations</SheetTitle>
                <SheetDescription>Application navigation</SheetDescription>
              </SheetHeader>
              <ApplicationNavigation
                onNavigate={() => setNavigationOpen(false)}
              />
              <p className="navigation-sheet-note">
                No hierarchy context is duplicated here.
              </p>
            </SheetContent>
          </Sheet>
        </header>

        <ViewingContext
          selection={viewingContext}
          onChange={onViewingContextChange}
        />
        <main
          className="main-content"
          id="main-content"
          aria-label="Main content"
          tabIndex={-1}
        >
          <Outlet context={viewingContext} />
        </main>
      </div>
    </div>
  )
}
