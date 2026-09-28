import type { ExpenseItem, ExpenseReport } from '../types/expense'
import { formatCurrency, formatDate } from './format'

export async function exportReportToPdf(report: ExpenseReport, items: ExpenseItem[], currencySymbol: string) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(report.businessName, margin, 50)
  doc.setFontSize(12)
  doc.text('Credit Card Expense Report', margin, 68)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const infoY = 92
  doc.text(`Staff Submitting Report: ${report.staffSubmittingReport || '-'}`, margin, infoY)
  doc.text(`Supervisor: ${report.supervisor || '-'}`, margin, infoY + 16)
  doc.text(
    `Report Date Span: ${formatDate(report.reportDateSpanStart)} - ${formatDate(report.reportDateSpanEnd)}`,
    margin,
    infoY + 32,
  )
  doc.text(`Submit to: ${report.submitTo}`, margin, infoY + 48)

  const rows = items.map((item, idx) => [
    String(idx + 1),
    formatDate(item.date),
    item.cardUserName,
    item.vendor,
    item.expensePurpose,
    formatCurrency(item.amount, currencySymbol),
    item.attachedSent ? 'Yes' : 'No',
  ])

  autoTable(doc, {
    startY: infoY + 66,
    head: [['#', 'Date', 'CC Card User', 'Vendor', 'Expense Purpose', 'Amount', 'Attached/Sent']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [20, 20, 30] },
    margin: { left: margin, right: margin },
  })

  const total = items.reduce((sum, i) => sum + i.amount, 0)
  // @ts-expect-error autoTable attaches lastAutoTable at runtime
  const afterTableY = (doc.lastAutoTable?.finalY ?? infoY + 66) + 24

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`Total Charges: ${formatCurrency(total, currencySymbol)}`, pageWidth - margin, afterTableY, {
    align: 'right',
  })

  let sigY = afterTableY + 50
  if (sigY > doc.internal.pageSize.getHeight() - 120) {
    doc.addPage()
    sigY = 80
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  const colWidth = (pageWidth - margin * 2 - 30) / 2

  doc.text('Requester (signature):', margin, sigY)
  if (report.requesterSignature) {
    try {
      doc.addImage(report.requesterSignature, 'PNG', margin, sigY + 8, 160, 50)
    } catch {
      // ignore malformed signature image
    }
  }
  doc.line(margin, sigY + 62, margin + colWidth, sigY + 62)
  doc.text(`Date: ${report.requesterSignedDate ? formatDate(report.requesterSignedDate) : '________________'}`, margin, sigY + 78)

  const col2X = margin + colWidth + 30
  doc.text('Authorized Approver (signature):', col2X, sigY)
  if (report.approverSignature) {
    try {
      doc.addImage(report.approverSignature, 'PNG', col2X, sigY + 8, 160, 50)
    } catch {
      // ignore malformed signature image
    }
  }
  doc.line(col2X, sigY + 62, col2X + colWidth, sigY + 62)
  doc.text(`Date: ${report.approverSignedDate ? formatDate(report.approverSignedDate) : '________________'}`, col2X, sigY + 78)

  const fileName = `${report.businessName.replace(/[^a-z0-9]+/gi, '-')}-expense-report-${report.year}-${String(report.month).padStart(2, '0')}.pdf`
  doc.save(fileName)
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function exportReportToCsv(report: ExpenseReport, items: ExpenseItem[], currencySymbol: string) {
  const header = ['#', 'Date', 'CC Card User', 'Vendor', 'Expense Purpose', 'Amount', 'Attached/Sent']
  const rows = items.map((item, idx) => [
    String(idx + 1),
    item.date,
    item.cardUserName,
    item.vendor,
    item.expensePurpose,
    formatCurrency(item.amount, currencySymbol),
    item.attachedSent ? 'Yes' : 'No',
  ])
  const total = items.reduce((sum, i) => sum + i.amount, 0)
  rows.push(['', '', '', '', 'Total Charges', formatCurrency(total, currencySymbol), ''])

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.businessName.replace(/[^a-z0-9]+/gi, '-')}-expense-report-${report.year}-${String(report.month).padStart(2, '0')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
