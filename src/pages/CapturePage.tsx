import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import Header from '../components/Header'

const ScanBackdrop = lazy(() => import('../components/ScanBackdrop'))
import ExpenseEditForm, { itemToFormValues, type ExpenseFormValues } from '../components/ExpenseEditForm'
import { runOcr, type OcrResult } from '../lib/ocr'
import { repo } from '../lib/db'
import { useExpenseStore } from '../store/useExpenseStore'
import { todayIso } from '../lib/format'
import type { ExpenseItem } from '../types/expense'

type Step = 'select' | 'processing' | 'review'

export default function CapturePage() {
  const navigate = useNavigate()
  const { settings, currentReport, addOrUpdateItem } = useExpenseStore()
  const [step, setStep] = useState<Step>('select')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [progress, setProgress] = useState(0)
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [values, setValues] = useState<ExpenseFormValues>(itemToFormValues({ date: todayIso(), attachedSent: true }))
  const [saving, setSaving] = useState(false)
  const [showRawText, setShowRawText] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    }
  }, [step])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFile(file: File | undefined) {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setImageBlob(file)
    setStep('processing')
    setProgress(0)

    try {
      const result = await runOcr(file, (p) => setProgress(p))
      setOcrResult(result)
      setValues(
        itemToFormValues({
          date: result.date ?? todayIso(),
          amount: result.amount ?? undefined,
          vendor: result.vendor ?? '',
          cardUserName: settings?.defaultCardUserName ?? '',
          attachedSent: true,
        }),
      )
    } catch {
      setOcrResult(null)
      setValues(itemToFormValues({ date: todayIso(), cardUserName: settings?.defaultCardUserName ?? '', attachedSent: true }))
    } finally {
      setStep('review')
    }
  }

  function skipToManualEntry() {
    setImageBlob(null)
    setPreviewUrl(null)
    setOcrResult(null)
    setValues(itemToFormValues({ date: todayIso(), cardUserName: settings?.defaultCardUserName ?? '', attachedSent: false }))
    setStep('review')
  }

  async function handleSave() {
    if (!currentReport) return
    setSaving(true)
    try {
      const existingItems = await repo.listItemsForReport(currentReport.id)
      const item: ExpenseItem = {
        id: crypto.randomUUID(),
        reportId: currentReport.id,
        entryNumber: existingItems.length + 1,
        date: values.date || todayIso(),
        cardUserName: values.cardUserName,
        vendor: values.vendor,
        expensePurpose: values.expensePurpose,
        amount: Number(values.amount) || 0,
        attachedSent: values.attachedSent,
        status: 'needs_review',
        ocrRawText: ocrResult?.rawText,
        ocrConfidence: ocrResult?.confidence,
        hasReceiptImage: !!imageBlob,
        hasAffidavit: false,
        createdAt: new Date().toISOString(),
      }
      await addOrUpdateItem(item)
      if (imageBlob) {
        await repo.saveReceiptImage(item.id, imageBlob)
      }

      if (!imageBlob) {
        navigate(`/item/${item.id}/affidavit`)
      } else {
        navigate('/report')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Scan Receipt" subtitle={step === 'review' ? 'Review the details' : undefined} back />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {step === 'select' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ink-900 ring-1 ring-ink-700">
            <ReceiptIcon />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-ink-100">Add a slip or invoice</p>
            <p className="mt-1 text-sm text-ink-400">We'll read the vendor, date and amount automatically.</p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <button className="btn-primary w-full" onClick={() => cameraInputRef.current?.click()}>
              <CameraIcon /> Take Photo
            </button>
            <button className="btn-secondary w-full" onClick={() => galleryInputRef.current?.click()}>
              <GalleryIcon /> Choose from Library
            </button>
            <button className="mt-1 text-sm font-medium text-ink-400 active:text-ink-200" onClick={skipToManualEntry}>
              No receipt available &rarr; enter manually
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-6 pb-24">
          <Suspense fallback={null}>
            <ScanBackdrop />
          </Suspense>
          {previewUrl && (
            <div className="relative h-48 w-36 overflow-hidden rounded-xl border border-ink-700 shadow-xl">
              <img src={previewUrl} alt="Receipt preview" className="h-full w-full object-cover" />
              <div
                className="absolute inset-x-0 h-8 bg-gradient-to-b from-gold-400/0 via-gold-400/40 to-gold-400/0"
                style={{ top: `${progress * 100}%`, transition: 'top 0.2s linear' }}
              />
            </div>
          )}
          <div className="w-full max-w-xs">
            <p className="mb-2 text-center text-sm font-medium text-ink-200">Reading your receipt&hellip;</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
              <div className="h-full rounded-full bg-gold-500 transition-[width] duration-200" style={{ width: `${Math.max(progress * 100, 4)}%` }} />
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div ref={cardRef} className="flex flex-1 flex-col gap-5 px-4 pb-28 pt-4">
          {previewUrl && (
            <img src={previewUrl} alt="Receipt" className="mx-auto h-40 w-auto rounded-xl border border-ink-700 object-cover" />
          )}

          {ocrResult && (
            <div className="rounded-xl border border-ink-800 bg-ink-900/60 px-3.5 py-2.5 text-xs text-ink-400">
              Auto-read confidence: <span className="font-medium text-ink-200">{Math.round(ocrResult.confidence)}%</span> &middot; double-check
              the fields below before saving.
            </div>
          )}

          <ExpenseEditForm values={values} onChange={setValues} currencySymbol={settings?.currencySymbol ?? '$'} />

          {ocrResult?.rawText && (
            <div>
              <button className="text-xs font-medium text-ink-400 underline underline-offset-2" onClick={() => setShowRawText((s) => !s)}>
                {showRawText ? 'Hide' : 'Show'} raw scanned text
              </button>
              {showRawText && (
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl border border-ink-800 bg-ink-950 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-ink-400">
                  {ocrResult.rawText}
                </pre>
              )}
            </div>
          )}

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/95 px-4 py-3 backdrop-blur-lg safe-bottom">
            <div className="mx-auto max-w-2xl">
              <button className="btn-primary w-full" onClick={handleSave} disabled={saving || !values.amount}>
                {saving ? 'Saving…' : imageBlob ? 'Save to Report' : 'Continue to Affidavit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReceiptIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4a527" strokeWidth="1.6">
      <path d="M6 3h12v18l-2.5-1.5L13 21l-1-1.5L11 21l-2.5-1.5L6 21V3Z" strokeLinejoin="round" />
      <path d="M9 8h6M9 11.5h6M9 15h4" strokeLinecap="round" />
    </svg>
  )
}
function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  )
}
function GalleryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m5 17 5-5 3.5 3.5L18 11l1.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
