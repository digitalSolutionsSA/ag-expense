import { useNavigate } from 'react-router-dom'
import type { ExpenseItem } from '../types/expense'
import { formatCurrency, formatDate } from '../lib/format'
import StatusPill from './StatusPill'

interface ExpenseRowProps {
  item: ExpenseItem
  index: number
  currencySymbol: string
}

export default function ExpenseRow({ item, index, currencySymbol }: ExpenseRowProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/item/${item.id}`)}
      className="expense-row flex w-full items-center gap-3 border-b border-ink-800/70 px-4 py-3 text-left active:bg-ink-900"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-800 text-[11px] font-semibold text-ink-300">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-ink-100">{item.vendor || 'Unknown vendor'}</p>
          {!item.hasReceiptImage && !item.hasAffidavit && (
            <span className="shrink-0 text-[10px] font-semibold text-danger-500">NO RECEIPT</span>
          )}
        </div>
        <p className="truncate text-xs text-ink-400">
          {formatDate(item.date)} &middot; {item.cardUserName || 'Unassigned'} &middot; {item.expensePurpose || 'No purpose set'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-ink-100">{formatCurrency(item.amount, currencySymbol)}</p>
        <div className="mt-1">
          <StatusPill status={item.status} />
        </div>
      </div>
    </button>
  )
}
