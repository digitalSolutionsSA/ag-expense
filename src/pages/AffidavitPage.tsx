import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import SignaturePad from '../components/SignaturePad'
import { repo } from '../lib/db'
import { useExpenseStore } from '../store/useExpenseStore'
import { exportAffidavitToPdf } from '../lib/exportAffidavit'
import { todayIso } from '../lib/format'
import type { ExpenseItem, MissingReceiptAffidavit, PaymentForm, ReceiptMissingReason } from '../types/expense'

const RECEIPT_OPTIONS: { value: ReceiptMissingReason; label: string }[] = [
  { value: 'lost', label: 'Lost' },
  { value: 'never_received', label: 'Never Received' },
  { value: 'other', label: 'Other' },
]

const PAYMENT_OPTIONS: { value: PaymentForm; label: string }[] = [
  { value: 'corporate_card', label: 'Corporate Credit Card' },
  { value: 'personal_card', label: 'Personal Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
]

function emptyAffidavit(itemId: string, item: ExpenseItem | null): MissingReceiptAffidavit {
  return {
    id: crypto.randomUUID(),
    expenseItemId: itemId,
    missingExpenseDescription: item?.expensePurpose ?? '',
    businessLocation: item?.vendor ?? '',
    date: item?.date ?? todayIso(),
    amount: item?.amount ?? 0,
    receiptStatus: 'lost',
    paymentForm: 'corporate_card',
    category: item?.expensePurpose ?? '',
    personsInvolved: '',
    employeeName: '',
    employeeDate: todayIso(),
    ceoName: '',
    ceoDate: '',
  }
}

export default function AffidavitPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const { settings, refreshItems } = useExpenseStore()
  const [item, setItem] = useState<ExpenseItem | null>(null)
  const [form, setForm] = useState<MissingReceiptAffidavit | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!itemId) return
    ;(async () => {
      const i = (await repo.getItem(itemId)) ?? null
      setItem(i)
      const existing = await repo.getAffidavitForItem(itemId)
      setForm(existing ?? emptyAffidavit(itemId, i))
    })()
  }, [itemId])

  function set<K extends keyof MissingReceiptAffidavit>(key: K, value: MissingReceiptAffidavit[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  async function handleSave() {
    if (!form || !item) return
    setSaving(true)
    try {
      await repo.saveAffidavit(form)
      await repo.saveItem({ ...item, hasAffidavit: true, status: item.status === 'needs_review' ? 'pending' : item.status })
      await refreshItems()
      navigate('/report')
    } finally {
      setSaving(false)
    }
  }

  if (!form || !item) {
    return (
      <div>
        <Header title="Missing Receipt Affidavit" back />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Loading&hellip;</p>
      </div>
    )
  }

  return (
    <div className="pb-32">
      <Header title="Missing Receipt Affidavit" subtitle="Sign only when a receipt truly cannot be recovered" back />

      <div className="flex flex-col gap-4 px-4 pt-4">
        <p className="rounded-xl border border-ink-800 bg-ink-900/60 px-3.5 py-2.5 text-xs leading-relaxed text-ink-400">
          When a receipt is lost or otherwise unavailable and all measures to obtain a copy have been exhausted, this
          affidavit should be completed and signed by the employee and the CEO (or representative). Not required for
          tips.
        </p>

        <Field label="I am missing a receipt for (expense)">
          <input className="input" value={form.missingExpenseDescription} onChange={(e) => set('missingExpenseDescription', e.target.value)} />
        </Field>
        <Field label="I incurred this expense at (business location)">
          <input className="input" value={form.businessLocation} onChange={(e) => set('businessLocation', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label={`Amount (${settings?.currencySymbol ?? '$'})`}>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="input"
              value={form.amount}
              onChange={(e) => set('amount', Number(e.target.value) || 0)}
            />
          </Field>
        </div>

        <Field label="The receipt was">
          <div className="flex flex-wrap gap-2">
            {RECEIPT_OPTIONS.map((o) => (
              <Chip key={o.value} active={form.receiptStatus === o.value} onClick={() => set('receiptStatus', o.value)}>
                {o.label}
              </Chip>
            ))}
          </div>
          {form.receiptStatus === 'other' && (
            <input
              className="input mt-2"
              placeholder="Please specify"
              value={form.receiptStatusOther ?? ''}
              onChange={(e) => set('receiptStatusOther', e.target.value)}
            />
          )}
        </Field>

        <Field label="Form of payment used">
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map((o) => (
              <Chip key={o.value} active={form.paymentForm === o.value} onClick={() => set('paymentForm', o.value)}>
                {o.label}
              </Chip>
            ))}
          </div>
          {form.paymentForm === 'other' && (
            <input
              className="input mt-2"
              placeholder="Please specify"
              value={form.paymentFormOther ?? ''}
              onChange={(e) => set('paymentFormOther', e.target.value)}
            />
          )}
        </Field>

        <Field label="Business Purpose / Expense Category">
          <input className="input" value={form.category} onChange={(e) => set('category', e.target.value)} />
        </Field>
        <Field label="Person(s) involved (travel/entertainment only)">
          <input className="input" value={form.personsInvolved ?? ''} onChange={(e) => set('personsInvolved', e.target.value)} />
        </Field>

        <p className="text-[11px] leading-relaxed text-ink-500">
          I understand that a Missing Receipt Affidavit should be used on rare occasions and may not be used on a
          routine basis. I certify that the amount shown is the amount I actually paid, that I have not and will not
          submit a duplicate claim, and that I have not and will not seek a claim for these expenses from any other
          source.
        </p>

        <div className="grid grid-cols-1 gap-4">
          <SignaturePad label="Employee Signature" value={form.employeeSignature} onChange={(v) => set('employeeSignature', v)} />
          <Field label="Employee Name">
            <input className="input" value={form.employeeName} onChange={(e) => set('employeeName', e.target.value)} />
          </Field>

          <SignaturePad label="CEO / CEO Representative's Signature" value={form.ceoSignature} onChange={(v) => set('ceoSignature', v)} />
          <Field label="CEO / Representative Name">
            <input className="input" value={form.ceoName} onChange={(e) => set('ceoName', e.target.value)} />
          </Field>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/95 px-4 py-3 backdrop-blur-lg safe-bottom">
          <div className="mx-auto flex max-w-2xl gap-3">
            <button className="btn-secondary flex-1" onClick={() => exportAffidavitToPdf(form, settings?.currencySymbol ?? '$')}>
              Export PDF
            </button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Affidavit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-300">{label}</span>
      {children}
    </label>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'border-gold-500 bg-gold-500/15 text-gold-400' : 'border-ink-700 bg-ink-900 text-ink-300'
      }`}
    >
      {children}
    </button>
  )
}
