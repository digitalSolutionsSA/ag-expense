import { formatCurrency } from '../lib/format'

interface TotalBarProps {
  total: number
  count: number
  currencySymbol: string
}

export default function TotalBar({ total, count, currencySymbol }: TotalBarProps) {
  return (
    <div className="mx-4 mt-4 flex items-center justify-between rounded-2xl border border-ink-800 bg-ink-900 px-4 py-3.5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Total charges</p>
        <p className="text-2xl font-bold text-ink-100">{formatCurrency(total, currencySymbol)}</p>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Entries</p>
        <p className="text-lg font-semibold text-gold-400">{count}</p>
      </div>
    </div>
  )
}
