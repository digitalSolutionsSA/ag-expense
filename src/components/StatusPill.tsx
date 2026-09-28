import type { ExpenseStatus } from '../types/expense'
import clsx from 'clsx'

const CONFIG: Record<ExpenseStatus, { label: string; classes: string }> = {
  needs_review: { label: 'Needs review', classes: 'bg-warn-500/15 text-warn-500' },
  pending: { label: 'Pending', classes: 'bg-ink-600/40 text-ink-200' },
  approved: { label: 'Approved', classes: 'bg-ok-500/15 text-ok-500' },
}

export default function StatusPill({ status }: { status: ExpenseStatus }) {
  const c = CONFIG[status]
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', c.classes)}>
      {c.label}
    </span>
  )
}
