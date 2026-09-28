import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import ExpenseEditForm, { itemToFormValues, type ExpenseFormValues } from '../components/ExpenseEditForm'
import StatusPill from '../components/StatusPill'
import { repo } from '../lib/db'
import { useReceiptImageUrl } from '../hooks/useReceiptImageUrl'
import { useExpenseStore } from '../store/useExpenseStore'
import type { ExpenseItem } from '../types/expense'

export default function ItemDetailPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const store = useExpenseStore()
  const [item, setItem] = useState<ExpenseItem | null>(null)
  const [values, setValues] = useState<ExpenseFormValues | null>(null)
  const [saving, setSaving] = useState(false)
  const imageUrl = useReceiptImageUrl(item?.id, item?.hasReceiptImage ?? false)

  useEffect(() => {
    if (!itemId) return
    repo.getItem(itemId).then((i) => {
      if (i) {
        setItem(i)
        setValues(itemToFormValues(i))
      }
    })
  }, [itemId])

  async function handleSave() {
    if (!item || !values) return
    setSaving(true)
    try {
      const updated: ExpenseItem = {
        ...item,
        date: values.date,
        cardUserName: values.cardUserName,
        vendor: values.vendor,
        expensePurpose: values.expensePurpose,
        amount: Number(values.amount) || 0,
        attachedSent: values.attachedSent,
        status: item.status === 'needs_review' ? 'pending' : item.status,
      }
      await repo.saveItem(updated)
      setItem(updated)
      await store.refreshItems()
      navigate(-1)
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove() {
    if (!item) return
    const updated: ExpenseItem = { ...item, status: 'approved' }
    await repo.saveItem(updated)
    setItem(updated)
    await store.refreshItems()
  }

  async function handleDelete() {
    if (!item) return
    if (!window.confirm('Delete this expense entry? This cannot be undone.')) return
    await repo.deleteItem(item.id)
    await store.refreshItems()
    navigate(-1)
  }

  if (!item || !values) {
    return (
      <div>
        <Header title="Entry" back />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Loading&hellip;</p>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <Header title="Edit Entry" subtitle={`Entry #${item.entryNumber}`} back right={<StatusPill status={item.status} />} />

      <div className="flex flex-col gap-5 px-4 pt-4">
        {imageUrl && <img src={imageUrl} alt="Receipt" className="mx-auto h-48 w-auto rounded-xl border border-ink-700 object-cover" />}

        {!item.hasReceiptImage && !item.hasAffidavit && (
          <button
            onClick={() => navigate(`/item/${item.id}/affidavit`)}
            className="rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-left text-sm font-medium text-danger-500"
          >
            No receipt attached &mdash; complete a Missing Receipt Affidavit &rarr;
          </button>
        )}
        {item.hasAffidavit && (
          <button
            onClick={() => navigate(`/item/${item.id}/affidavit`)}
            className="rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-left text-sm font-medium text-ink-200"
          >
            View Missing Receipt Affidavit &rarr;
          </button>
        )}

        <ExpenseEditForm values={values} onChange={setValues} currencySymbol={store.settings?.currencySymbol ?? '$'} />

        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={handleDelete}>
            Delete
          </button>
          {item.status !== 'approved' && (
            <button className="btn-secondary flex-1" onClick={handleApprove}>
              Approve
            </button>
          )}
        </div>

        <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
