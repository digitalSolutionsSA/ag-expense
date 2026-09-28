import type { ExpenseItem } from '../types/expense'

export interface ExpenseFormValues {
  date: string
  cardUserName: string
  vendor: string
  expensePurpose: string
  amount: string
  attachedSent: boolean
}

export function itemToFormValues(item: Partial<ExpenseItem>): ExpenseFormValues {
  return {
    date: item.date ?? '',
    cardUserName: item.cardUserName ?? '',
    vendor: item.vendor ?? '',
    expensePurpose: item.expensePurpose ?? '',
    amount: item.amount != null ? String(item.amount) : '',
    attachedSent: item.attachedSent ?? true,
  }
}

interface ExpenseEditFormProps {
  values: ExpenseFormValues
  onChange: (values: ExpenseFormValues) => void
  currencySymbol: string
}

const PURPOSE_SUGGESTIONS = ['Supplies', 'Equipment', 'Studio Rent', 'Utilities', 'Marketing', 'Travel', 'Meals', 'Software', 'Other']

export default function ExpenseEditForm({ values, onChange, currencySymbol }: ExpenseEditFormProps) {
  function set<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input
            type="date"
            value={values.date}
            onChange={(e) => set('date', e.target.value)}
            className="input"
          />
        </Field>
        <Field label={`Amount (${currencySymbol})`}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={values.amount}
            onChange={(e) => set('amount', e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <Field label="Vendor">
        <input
          type="text"
          placeholder="e.g. Office Depot"
          value={values.vendor}
          onChange={(e) => set('vendor', e.target.value)}
          className="input"
        />
      </Field>

      <Field label="CC Card User Name">
        <input
          type="text"
          placeholder="Who used the card"
          value={values.cardUserName}
          onChange={(e) => set('cardUserName', e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Expense Purpose">
        <input
          type="text"
          list="purpose-suggestions"
          placeholder="What was this for?"
          value={values.expensePurpose}
          onChange={(e) => set('expensePurpose', e.target.value)}
          className="input"
        />
        <datalist id="purpose-suggestions">
          {PURPOSE_SUGGESTIONS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </Field>

      <label className="flex items-center gap-2.5 rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-3">
        <input
          type="checkbox"
          checked={values.attachedSent}
          onChange={(e) => set('attachedSent', e.target.checked)}
          className="h-4 w-4 accent-gold-500"
        />
        <span className="text-sm text-ink-200">Receipt attached / sent</span>
      </label>
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
