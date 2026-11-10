import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from '../features/admin-shell/admin-shell'
import { ShellPlaceholder } from '../features/admin-shell/components/shell-placeholder'
import { WorkspaceRoute } from '../features/workspace/workspace-route'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminShell />}>
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
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
