import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import TotalBar from '../components/TotalBar'
import ExpenseTable from '../components/ExpenseTable'
import SignaturePad from '../components/SignaturePad'
import { repo } from '../lib/db'
import { useExpenseStore } from '../store/useExpenseStore'
import { exportReportToCsv, exportReportToPdf } from '../lib/exportReport'
import { formatDate, monthLabel, todayIso } from '../lib/format'
import type { ExpenseItem, ExpenseReport } from '../types/expense'

export default function ReportPage() {
  const { reportId } = useParams()
  const store = useExpenseStore()
  const [localReport, setLocalReport] = useState<ExpenseReport | null>(null)
  const [localItems, setLocalItems] = useState<ExpenseItem[]>([])
  const [saving, setSaving] = useState(false)

  const isCurrent = !reportId
  const report = isCurrent ? store.currentReport : localReport
  const items = isCurrent ? store.items : localItems
  const settings = store.settings

  useEffect(() => {
    if (!reportId) return
    ;(async () => {
      const r = await repo.getReport(reportId)
      if (r) {
        setLocalReport(r)
        setLocalItems(await repo.listItemsForReport(r.id))
      }
    })()
  }, [reportId])

  async function refresh() {
    if (isCurrent) await store.refreshItems()
    else if (localReport) setLocalItems(await repo.listItemsForReport(localReport.id))
  }

  async function updateReport(patch: Partial<ExpenseReport>) {
    if (!report) return
    const next = { ...report, ...patch }
    await repo.saveReport(next)
    if (isCurrent) store.updateReport(next)
    else setLocalReport(next)
  }

  async function handleSubmit() {
    if (!report) return
    setSaving(true)
    try {
      await updateReport({
        status: 'submitted',
        requesterSignedDate: report.requesterSignedDate ?? todayIso(),
      })
    } finally {
      setSaving(false)
    }
  }

  const total = items.reduce((sum, i) => sum + i.amount, 0)

  if (!report) {
    return (
      <div className="pb-28">
        <Header title="Report" back={!isCurrent} />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Loading report&hellip;</p>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <Header
        title={monthLabel(report.month, report.year)}
        subtitle={`${formatDate(report.reportDateSpanStart)} – ${formatDate(report.reportDateSpanEnd)}`}
        back={!isCurrent}
        right={
          <div className="flex gap-1.5">
            <IconButton label="Export CSV" onClick={() => exportReportToCsv(report, items, settings?.currencySymbol ?? '$')}>
              <CsvIcon />
            </IconButton>
            <IconButton label="Export PDF" onClick={() => exportReportToPdf(report, items, settings?.currencySymbol ?? '$')}>
              <PdfIcon />
            </IconButton>
          </div>
        }
      />

      <div className="mx-4 mt-3 flex items-center justify-between text-xs text-ink-400">
        <span>Staff: {report.staffSubmittingReport || 'Not set'}</span>
        <StatusBadge status={report.status} />
      </div>

      <TotalBar total={total} count={items.length} currencySymbol={settings?.currencySymbol ?? '$'} />

      <div className="mt-6 px-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Entries</p>
        <div className="overflow-hidden rounded-2xl border border-ink-800">
          <ExpenseTable items={items} currencySymbol={settings?.currencySymbol ?? '$'} />
        </div>
      </div>

      <div className="mt-6 space-y-4 px-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Sign &amp; submit</p>
        <SignaturePad
          label="Requester (signature)"
          value={report.requesterSignature}
          onChange={(v) => updateReport({ requesterSignature: v, requesterSignedDate: v ? todayIso() : undefined })}
        />
        <SignaturePad
          label="Authorized Approver (signature)"
          value={report.approverSignature}
          onChange={(v) => updateReport({ approverSignature: v, approverSignedDate: v ? todayIso() : undefined })}
        />

        {report.status === 'open' && (
          <button className="btn-primary w-full" onClick={handleSubmit} disabled={saving || !items.length}>
            {saving ? 'Submitting…' : `Submit to ${report.submitTo.split(' - ')[0]}`}
          </button>
        )}
        {report.status !== 'open' && (
          <p className="text-center text-xs text-ink-400">
            Submitted to {report.submitTo}
            {report.requesterSignedDate ? ` on ${formatDate(report.requesterSignedDate)}` : ''}.
          </p>
        )}
      </div>

      {/* keep list reactive after edits from item detail page */}
      <RefreshOnFocus onRefresh={refresh} />
    </div>
  )
}

function RefreshOnFocus({ onRefresh }: { onRefresh: () => void }) {
  useEffect(() => {
    window.addEventListener('focus', onRefresh)
    onRefresh()
    return () => window.removeEventListener('focus', onRefresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function StatusBadge({ status }: { status: ExpenseReport['status'] }) {
  const label = status === 'open' ? 'Open' : status === 'submitted' ? 'Submitted' : 'Approved'
  const classes =
    status === 'open' ? 'bg-ink-600/40 text-ink-200' : status === 'submitted' ? 'bg-warn-500/15 text-warn-500' : 'bg-ok-500/15 text-ok-500'
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${classes}`}>{label}</span>
}

function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-300 active:bg-ink-800"
    >
      {children}
    </button>
  )
}

function CsvIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l4 4v14H6V3Z" strokeLinejoin="round" />
      <path d="M8.5 13v5M12 13v5M15.5 13v5" strokeLinecap="round" />
    </svg>
  )
}
function PdfIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l4 4v14H6V3Z" strokeLinejoin="round" />
      <path d="M9 12.5h1.4a1.3 1.3 0 1 0 0-2.6H9v6M13 16v-6h2M13 13h1.6M17 10v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
