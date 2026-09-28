export interface ParsedReceipt {
  date: string | null // yyyy-mm-dd
  amount: number | null
  vendor: string | null
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

const TOTAL_KEYWORDS = [
  'total', 'amount due', 'balance due', 'grand total', 'amount', 'total due', 'you paid', 'card total',
]
const SUBTOTAL_KEYWORDS = ['subtotal', 'sub total', 'sub-total', 'tax', 'vat', 'change', 'cash tendered']
const NOISE_LINE = /^[\s*=_-]{3,}$/

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  const y = year < 100 ? 2000 + year : year
  const d = new Date(y, month - 1, day)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function findDate(text: string): string | null {
  // 1) numeric dates: dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd, dd-mm-yy etc.
  const numeric = /\b(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})\b/g
  let match: RegExpExecArray | null
  const candidates: string[] = []
  while ((match = numeric.exec(text))) {
    const [, a, b, c] = match
    const na = Number(a)
    const nb = Number(b)
    const nc = Number(c)
    let iso: string | null = null
    if (a.length === 4) {
      // yyyy-mm-dd
      iso = toIsoDate(na, nb, nc)
    } else if (c.length === 4) {
      // could be dd/mm/yyyy or mm/dd/yyyy — prefer dd/mm if first part > 12
      if (na > 12) iso = toIsoDate(nc, nb, na)
      else iso = toIsoDate(nc, na, nb)
    } else {
      // two-digit year, assume dd/mm/yy
      if (na > 12) iso = toIsoDate(nc, nb, na)
      else iso = toIsoDate(nc, na, nb)
    }
    if (iso) candidates.push(iso)
  }
  if (candidates.length) {
    // prefer a date that isn't in the future and is reasonably recent
    const now = new Date()
    const sorted = candidates.sort((x, y) => {
      const dx = Math.abs(new Date(x).getTime() - now.getTime())
      const dy = Math.abs(new Date(y).getTime() - now.getTime())
      return dx - dy
    })
    return sorted[0]
  }

  // 2) written month dates: "20 Sep 2026", "Sep 20, 2026", "September 20 2026"
  const written =
    /\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*,?\s*(\d{2,4})\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{2,4})\b/i
  const wm = written.exec(text)
  if (wm) {
    if (wm[1]) {
      const month = MONTHS[wm[2].toLowerCase()]
      return toIsoDate(Number(wm[3]), month, Number(wm[1]))
    } else if (wm[4]) {
      const month = MONTHS[wm[4].toLowerCase()]
      return toIsoDate(Number(wm[6]), month, Number(wm[5]))
    }
  }

  return null
}

function findAmount(text: string): number | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const moneyPattern = /(?:[rR$€£]\s?)?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})|\d+\.\d{2})/g

  const scored: { amount: number; score: number }[] = []

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase()
    const isTotalLine = TOTAL_KEYWORDS.some((k) => lower.includes(k))
    const isSubtotalLine = SUBTOTAL_KEYWORDS.some((k) => lower.includes(k)) && !lower.includes('total')

    let m: RegExpExecArray | null
    moneyPattern.lastIndex = 0
    while ((m = moneyPattern.exec(line))) {
      const raw = m[1].replace(/[,\s]/g, '')
      const value = Number(raw)
      if (Number.isNaN(value) || value <= 0) continue

      let score = 1
      if (isTotalLine) score += 10
      if (isSubtotalLine) score -= 5
      if (lower.includes('grand total') || lower.includes('total due') || lower.includes('balance due')) score += 5
      // Amounts near the bottom of the receipt are more likely to be the total.
      score += (idx / Math.max(lines.length, 1)) * 3

      scored.push({ amount: value, score })
    }
  })

  if (!scored.length) return null
  scored.sort((a, b) => b.score - a.score || b.amount - a.amount)
  return scored[0].amount
}

function findVendor(text: string): string | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && !NOISE_LINE.test(l))

  for (const line of lines.slice(0, 6)) {
    const lower = line.toLowerCase()
    const digitRatio = (line.match(/\d/g)?.length ?? 0) / line.length
    const looksLikeAddress = /\b(street|st\.|road|rd\.|ave|avenue|suite|ste\.)\b/i.test(line)
    const looksLikeDate = /\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}/.test(line)
    const looksLikeReceiptWord = ['receipt', 'invoice', 'tax invoice', 'order #', 'ref #'].some((k) => lower.includes(k))

    if (digitRatio > 0.4 || looksLikeAddress || looksLikeDate || looksLikeReceiptWord) continue
    if (line.length > 40) continue
    return line
  }
  return lines[0] ?? null
}

export function parseReceiptText(text: string): ParsedReceipt {
  return {
    date: findDate(text),
    amount: findAmount(text),
    vendor: findVendor(text),
  }
}
