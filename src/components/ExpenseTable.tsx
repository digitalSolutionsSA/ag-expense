import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { ExpenseItem } from '../types/expense'
import ExpenseRow from './ExpenseRow'

interface ExpenseTableProps {
  items: ExpenseItem[]
  currencySymbol: string
  emptyMessage?: string
}

export default function ExpenseTable({ items, currencySymbol, emptyMessage }: ExpenseTableProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!listRef.current) return
    const rows = listRef.current.querySelectorAll('.expense-row')
    gsap.fromTo(
      rows,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' },
    )
  }, [items.length])

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <p className="text-sm text-ink-400">{emptyMessage ?? 'No expenses yet for this period.'}</p>
      </div>
    )
  }

  return (
    <div ref={listRef}>
      {items.map((item, idx) => (
        <ExpenseRow key={item.id} item={item} index={idx + 1} currencySymbol={currencySymbol} />
      ))}
    </div>
  )
}
