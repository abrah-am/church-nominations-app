import { CalendarClock, Church, ListChecks } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface ApplicationNavigationProps {
  onNavigate?: () => void
}

export function ApplicationNavigation({
  onNavigate,
}: ApplicationNavigationProps) {
  const { pathname } = useLocation()
  const electionsCurrent = pathname === '/admin' || pathname === '/admin/setup'

  return (
    <nav className="application-navigation" aria-label="Application">
      <section aria-labelledby="application-nav-heading">
        <h2 className="navigation-group-label" id="application-nav-heading">
          Application
        </h2>
        <Link
          className={`navigation-link${electionsCurrent ? ' is-current' : ''}`}
          to="/admin/setup"
          aria-current={electionsCurrent ? 'page' : undefined}
          onClick={onNavigate}
        >
          <ListChecks aria-hidden="true" focusable="false" />
          <span>Elections</span>
        </Link>
      </section>

      <section aria-labelledby="settings-nav-heading">
        <h2 className="navigation-group-label" id="settings-nav-heading">
          Settings
        </h2>
        <Link
          className={`navigation-link navigation-link-subtle${pathname === '/admin/setup/churches' ? ' is-current' : ''}`}
          to="/admin/setup/churches"
          aria-current={
            pathname === '/admin/setup/churches' ? 'page' : undefined
          }
          onClick={onNavigate}
        >
          <Church aria-hidden="true" focusable="false" />
          <span>Church settings</span>
        </Link>
        <Link
          className={`navigation-link navigation-link-subtle${pathname === '/admin/setup/terms' ? ' is-current' : ''}`}
          to="/admin/setup/terms"
          aria-current={pathname === '/admin/setup/terms' ? 'page' : undefined}
          onClick={onNavigate}
        >
          <CalendarClock aria-hidden="true" focusable="false" />
          <span>Term management</span>
        </Link>
      </section>
    </nav>
  )
}
