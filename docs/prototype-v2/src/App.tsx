import Shell from './components/Shell'
import AdminView from './features/admin/AdminView'
import VoterView from './features/voter/VoterView'
import PresentationView from './features/presentation/PresentationView'
import SetupView from './features/setup/SetupView'
import { StateProvider } from './state/StateProvider'

export default function App() {
  const path = window.location.pathname
  const view = path.startsWith('/vote') ? '/vote' : path.startsWith('/presentation') ? '/presentation' : '/admin'
  const setup = view === '/admin' && path.startsWith('/admin/setup')
  const setupView = path.startsWith('/admin/setup/churches') ? 'churches' : path.startsWith('/admin/setup/terms') ? 'terms' : 'term'
  return <StateProvider><Shell view={view}>{view === '/vote' ? <VoterView /> : view === '/presentation' ? <PresentationView /> : setup ? <SetupView view={setupView} /> : <AdminView />}</Shell></StateProvider>
}