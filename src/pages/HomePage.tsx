import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import Header from '../components/Header'
import TotalBar from '../components/TotalBar'
import ExpenseTable from '../components/ExpenseTable'
import { useExpenseStore } from '../store/useExpenseStore'
import { monthLabel } from '../lib/format'

export default function HomePage() {
  const navigate = useNavigate()
  const { settings, currentReport, items, loading } = useExpenseStore()
  const fabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (fabRef.current) {
      gsap.fromTo(fabRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.8)', delay: 0.15 })
    }
  }, [])

  const total = items.reduce((sum, i) => sum + i.amount, 0)
  const needsReview = items.filter((i) => i.status === 'needs_review').length
  const recent = [...items].slice(-5).reverse()

  return (
    <div className="pb-28">
      <Header
        title={settings?.staffName ? `Hi, ${settings.staffName.split(' ')[0]}` : 'AG Expenses'}
        subtitle={currentReport ? monthLabel(currentReport.month, currentReport.year) : undefined}
      />

      {!loading && currentReport && (
        <>
          <TotalBar total={total} count={items.length} currencySymbol={settings?.currencySymbol ?? '$'} />

          {needsReview > 0 && (
            <button
              onClick={() => navigate('/report')}
              className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-between rounded-xl bg-warn-500/10 px-4 py-2.5 text-left"
            >
              <span className="text-sm font-medium text-warn-500">{needsReview} entr{needsReview === 1 ? 'y needs' : 'ies need'} review</span>
              <span className="text-warn-500">&rarr;</span>
            </button>
          )}

          <div className="mt-6 px-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Recent</p>
            <div className="overflow-hidden rounded-2xl border border-ink-800">
              <ExpenseTable items={recent} currencySymbol={settings?.currencySymbol ?? '$'} emptyMessage="Nothing scanned yet this month." />
            </div>
            {items.length > 5 && (
              <button onClick={() => navigate('/report')} className="mt-3 text-sm font-medium text-gold-400 active:opacity-70">
                View full report &rarr;
              </button>
            )}
          </div>
        </>
      )}

      <button
        ref={fabRef}
        onClick={() => navigate('/capture')}
        className="fixed bottom-24 right-5 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-ink-950 shadow-[0_8px_24px_rgba(212,165,39,0.4)] active:scale-95"
        aria-label="Scan a receipt"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" strokeLinejoin="round" />
          <circle cx="12" cy="13.5" r="3.2" />
        </svg>
      </button>
    </div>
  )
}
