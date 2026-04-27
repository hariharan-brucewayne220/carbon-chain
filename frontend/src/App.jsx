import { useState } from 'react'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import Report from './pages/Report'
import FacilityDetail from './pages/FacilityDetail'
import { useFacilities } from './hooks/useFacilities'

export default function App() {
  const [route, setRoute]       = useState({ name: 'dashboard' })
  const [selected, setSelected] = useState(null)
  const [toast, setToast]       = useState(null)
  const { facilities, refresh } = useFacilities()

  function fireToast(t) {
    setToast(t)
    setTimeout(() => setToast(null), 4500)
  }

  function openFacility(f) {
    setSelected(f)
    setRoute({ name: 'facility', id: f.id })
  }

  function navigate(r) {
    setRoute(r)
    if (r.name !== 'facility') setSelected(null)
  }

  async function onRegisterSuccess() {
    fireToast({ kind: 'success', title: 'Facility registered!' })
    await refresh()          // reload from Supabase so Report dropdown updates
    navigate({ name: 'dashboard' })
  }

  return (
    <div className="absolute inset-0" style={{ backgroundColor: '#0f172a' }}>
      <Navbar route={route} setRoute={navigate} />

      {route.name === 'dashboard' && (
        <Dashboard facilities={facilities} onOpenFacility={openFacility} />
      )}
      {route.name === 'register' && (
        <Register onSuccess={onRegisterSuccess} fireToast={fireToast} />
      )}
      {route.name === 'report' && (
        <Report facilities={facilities} fireToast={fireToast} refresh={refresh} onNavigate={navigate} />
      )}
      {route.name === 'facility' && (
        <FacilityDetail
          facility={facilities.find((f) => f.id === route.id) || selected}
          allFacilities={facilities}
          onBack={() => navigate({ name: 'dashboard' })}
          onOpenFacility={openFacility}
          refresh={refresh}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}
