import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { repo } from '../lib/db'
import { useExpenseStore } from '../store/useExpenseStore'
import { formatCurrency, monthLabel } from '../lib/format'
import type { ExpenseItem, ExpenseReport } from '../types/expense'

export default function HistoryPage() {
  const navigate = useNavigate()
  const { settings } = useExpenseStore()
  const [reports, setReports] = useState<(ExpenseReport & { total: number; count: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const list = await repo.listReports()
      const withTotals = await Promise.all(
        list.map(async (r) => {
          const items: ExpenseItem[] = await repo.listItemsForReport(r.id)
          return { ...r, total: items.reduce((s, i) => s + i.amount, 0), count: items.length }
        }),
      )
      setReports(withTotals)
      setLoading(false)
    })()
  }, [])

  return (
    <div className="pb-28">
      <Header title="History" subtitle="All monthly reports" />

      {loading && <p className="px-4 py-10 text-center text-sm text-ink-400">Loading&hellip;</p>}

      {!loading && !reports.length && (
        <p className="px-4 py-10 text-center text-sm text-ink-400">No reports yet &mdash; scan your first receipt to start one.</p>
      )}

      <div className="mt-2 px-4">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => navigate(`/report/${r.id}`)}
            className="mb-3 flex w-full items-center justify-between rounded-2xl border border-ink-800 bg-ink-900 px-4 py-3.5 text-left active:bg-ink-800"
          >
            <div>
              <p className="text-sm font-semibold text-ink-100">{monthLabel(r.month, r.year)}</p>
              <p className="mt-0.5 text-xs text-ink-400">
                {r.count} entr{r.count === 1 ? 'y' : 'ies'} &middot; <StatusText status={r.status} />
              </p>
            </div>
            <p className="text-sm font-semibold text-ink-100">{formatCurrency(r.total, settings?.currencySymbol ?? '$')}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function StatusText({ status }: { status: ExpenseReport['status'] }) {
  const label = status === 'open' ? 'Open' : status === 'submitted' ? 'Submitted' : 'Approved'
  const color = status === 'open' ? 'text-ink-400' : status === 'submitted' ? 'text-warn-500' : 'text-ok-500'
  return <span className={color}>{label}</span>
}
