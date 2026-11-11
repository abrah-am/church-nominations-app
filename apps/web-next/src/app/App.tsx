import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { createExperiencePreview } from '../data/experience-preview'
import { AdminShell } from '../features/admin-shell/admin-shell'
import { ShellPlaceholder } from '../features/admin-shell/components/shell-placeholder'
import { PresentationView } from '../features/presentation/presentation-view'
import { VoterView, type VoterPreviewState } from '../features/voter/voter-view'
import { WorkspaceRoute } from '../features/workspace/workspace-route'
import { initialViewingContext } from '../data/mock-admin-context'

export function AppRoutes() {
  const [viewingContext, setViewingContext] = useState(initialViewingContext)
  const preview = useMemo(() => createExperiencePreview(), [])

  return (
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
            <VoterPreviewRoute preview={preview} />
          </ExperiencePreviewPage>
        }
      />
      <Route
        path="/presentation/preview"
        element={
          <ExperiencePreviewPage current="presentation">
            <PresentationPreviewRoute preview={preview} />
          </ExperiencePreviewPage>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

function VoterPreviewRoute({ preview }: { preview: ReturnType<typeof createExperiencePreview> }) {
  const [searchParams] = useSearchParams()
  const allowedStates: readonly VoterPreviewState[] = ['nomination', 'voting', 'confirmation', 'waiting', 'closed']
  const requestedState = searchParams.get('state')
  const state = allowedStates.find((item) => item === requestedState) ?? 'voting'

  return (
    <VoterView
      preview={preview}
      navigation={{
        state,
        hrefForState: (nextState) => `/voter/preview?state=${nextState}`,
      }}
    />
  )
}

function PresentationPreviewRoute({ preview }: { preview: ReturnType<typeof createExperiencePreview> }) {
  const [searchParams] = useSearchParams()
  const resultsVisibility = searchParams.get('results') === 'visible' ? 'visible' : 'hidden'

  return <PresentationView preview={preview} resultsVisibility={resultsVisibility} />
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
