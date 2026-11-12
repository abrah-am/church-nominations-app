import { useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { createMockElectionStore } from '../data/mock-election-store'
import { MockElectionProvider } from '../data/mock-election-provider'
import { AdminShell } from '../features/admin-shell/admin-shell'
import { ShellPlaceholder } from '../features/admin-shell/components/shell-placeholder'
import { InteractivePresentationView } from '../features/presentation/interactive-presentation-view'
import { InteractiveVoterView } from '../features/voter/interactive-voter-view'
import { WorkspaceRoute } from '../features/workspace/workspace-route'
import { initialViewingContext } from '../data/mock-admin-context'

export function AppRoutes() {
  const [viewingContext, setViewingContext] = useState(initialViewingContext)
  const [store] = useState(createMockElectionStore)

  return (
    <MockElectionProvider store={store}>
    <Routes>
      <Route
        path="/admin"
        element={
          <AdminShell
            viewingContext={viewingContext}
            onViewingContextChange={setViewingContext}
          />
        }
      >
        <Route index element={<WorkspaceRoute />} />
        <Route path="setup" element={<ShellPlaceholder title="Elections" />} />
        <Route
          path="setup/churches"
          element={<ShellPlaceholder title="Church settings" />}
        />
        <Route
          path="setup/terms"
          element={<ShellPlaceholder title="Term management" />}
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route
        path="/voter/preview"
        element={
          <ExperiencePreviewPage current="voter">
            <InteractiveVoterView />
          </ExperiencePreviewPage>
        }
      />
      <Route
        path="/presentation/preview"
        element={
          <ExperiencePreviewPage current="presentation">
            <InteractivePresentationView />
          </ExperiencePreviewPage>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
    </MockElectionProvider>
  )
}

function ExperiencePreviewPage({
  current,
  children,
}: {
  current: 'voter' | 'presentation'
  children: ReactNode
}) {
  return (
    <div className="experience-preview-page">
      <a className="skip-link" href="#experience-content">Skip to main content</a>
      <header className="experience-preview-header">
        <Link className="experience-preview-brand" to="/admin">Church nominations</Link>
        <nav className="experience-preview-navigation" aria-label="Experience previews">
          <Link to="/admin">Admin preview</Link>
          <Link to="/voter/preview?state=voting" aria-current={current === 'voter' ? 'page' : undefined}>Voter preview</Link>
          <Link to="/presentation/preview?results=hidden" aria-current={current === 'presentation' ? 'page' : undefined}>Presentation preview</Link>
        </nav>
      </header>
      <main id="experience-content" className="experience-preview-content">
        <p className="experience-preview-context-note">
          Mock active participant session · separate from the Admin viewing context
        </p>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
