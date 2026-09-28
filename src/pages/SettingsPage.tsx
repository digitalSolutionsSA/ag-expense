import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { useExpenseStore } from '../store/useExpenseStore'
import type { AppSettings } from '../types/expense'

export default function SettingsPage() {
  const { settings, updateSettings } = useExpenseStore()
  const [form, setForm] = useState<AppSettings | null>(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  async function handleSave() {
    if (!form) return
    await updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  if (!form) return null

  return (
    <div className="pb-28">
      <Header title="Settings" subtitle="Applies to new reports" />

      <div className="flex flex-col gap-4 px-4 pt-4">
        <Field label="Business Name">
          <input className="input" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
        </Field>
        <Field label="Your Name (Staff Submitting Report)">
          <input className="input" value={form.staffName} onChange={(e) => set('staffName', e.target.value)} />
        </Field>
        <Field label="Supervisor">
          <input className="input" value={form.supervisor} onChange={(e) => set('supervisor', e.target.value)} />
        </Field>
        <Field label="Submit Report To">
          <input className="input" value={form.submitTo} onChange={(e) => set('submitTo', e.target.value)} />
        </Field>
        <Field label="Default CC Card User Name">
          <input className="input" value={form.defaultCardUserName} onChange={(e) => set('defaultCardUserName', e.target.value)} />
        </Field>
        <Field label="Currency Symbol">
          <input className="input" value={form.currencySymbol} maxLength={3} onChange={(e) => set('currencySymbol', e.target.value)} />
        </Field>

        <button className="btn-primary w-full" onClick={handleSave}>
          {saved ? 'Saved ✓' : 'Save Settings'}
        </button>

        <div className="mt-4 rounded-xl border border-ink-800 bg-ink-900/60 px-4 py-3 text-xs leading-relaxed text-ink-400">
          <p className="mb-1 font-semibold text-ink-300">About your data</p>
          Everything is stored privately on this device (no account needed). Use Export PDF/CSV on any report to
          share it. If you'd like reports synced across devices later, this app can be connected to a cloud backend
          without losing any existing data.
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
