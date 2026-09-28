import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import CapturePage from './pages/CapturePage'
import ReportPage from './pages/ReportPage'
import ItemDetailPage from './pages/ItemDetailPage'
import AffidavitPage from './pages/AffidavitPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import { useExpenseStore } from './store/useExpenseStore'

export default function App() {
  const init = useExpenseStore((s) => s.init)
  const loading = useExpenseStore((s) => s.loading)
  const location = useLocation()

  useEffect(() => {
    init()
  }, [init])

  const hideNav = location.pathname.startsWith('/capture') || location.pathname.includes('/affidavit')

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-ink-700 border-t-gold-500" />
          <p className="text-sm text-ink-400">Loading AG Expenses&hellip;</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-ink-950">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/report/:reportId" element={<ReportPage />} />
        <Route path="/item/:itemId" element={<ItemDetailPage />} />
        <Route path="/item/:itemId/affidavit" element={<AffidavitPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  )
}
