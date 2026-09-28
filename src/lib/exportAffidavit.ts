import type { MissingReceiptAffidavit } from '../types/expense'
import { formatCurrency, formatDate } from './format'

const RECEIPT_STATUS_LABEL: Record<MissingReceiptAffidavit['receiptStatus'], string> = {
  lost: 'Lost',
  never_received: 'Never Received',
  other: 'Other',
}

const PAYMENT_FORM_LABEL: Record<MissingReceiptAffidavit['paymentForm'], string> = {
  corporate_card: 'Corporate Credit Card',
  personal_card: 'Personal Credit Card',
  check: 'Check',
  cash: 'Cash',
  other: 'Other',
}

export async function exportAffidavitToPdf(affidavit: MissingReceiptAffidavit, currencySymbol: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 48
  let y = 56

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('MISSING RECEIPT AFFIDAVIT', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' })
  y += 30

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const intro =
    'When a receipt is lost or otherwise unavailable and all measures to obtain a copy have been exhausted, ' +
    'the Missing Receipt Affidavit should be completed. It should be signed by the employee and the CEO. ' +
    'NOTE: A Missing Receipt Affidavit is not required for tips.'
  const introLines = doc.splitTextToSize(intro, doc.internal.pageSize.getWidth() - margin * 2)
  doc.text(introLines, margin, y)
  y += introLines.length * 12 + 20

  doc.setFontSize(10)
  const field = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value || '-', margin + 200, y)
    y += 20
  }

  field('I am missing a receipt for (expense):', affidavit.missingExpenseDescription)
  field('I incurred this expense at (business location):', affidavit.businessLocation)
  field('Date:', formatDate(affidavit.date))
  field('Expense Amount:', formatCurrency(affidavit.amount, currencySymbol))
  field(
    'The receipt was:',
    `${RECEIPT_STATUS_LABEL[affidavit.receiptStatus]}${affidavit.receiptStatus === 'other' ? ` (${affidavit.receiptStatusOther ?? ''})` : ''}`,
  )
  field(
    'Form of payment used:',
    `${PAYMENT_FORM_LABEL[affidavit.paymentForm]}${affidavit.paymentForm === 'other' ? ` (${affidavit.paymentFormOther ?? ''})` : ''}`,
  )
  field('Business Purpose / Expense Category:', affidavit.category)
  field('Person(s) involved:', affidavit.personsInvolved ?? '-')

  y += 20
  const certify =
    'I understand that a Missing Receipt Affidavit should be used on rare occasions and may not be used on a ' +
    'routine basis. I further understand that excessive use of a Missing Receipt Affidavit may revoke the ' +
    'privilege of utilizing a company credit card. I certify that the amount shown is the amount I actually ' +
    'paid, that I have not and will not submit a duplicate claim, and that I have not and will not seek a ' +
    'claim for these expenses from any other source.'
  const certifyLines = doc.splitTextToSize(certify, doc.internal.pageSize.getWidth() - margin * 2)
  doc.text(certifyLines, margin, y)
  y += certifyLines.length * 12 + 30

  const colWidth = (doc.internal.pageSize.getWidth() - margin * 2 - 30) / 2
  const col2X = margin + colWidth + 30

  doc.setFont('helvetica', 'bold')
  doc.text('Employee Signature', margin, y)
  doc.text("CEO/CEO Representative's Signature", col2X, y)
  y += 10
  if (affidavit.employeeSignature) {
    try {
      doc.addImage(affidavit.employeeSignature, 'PNG', margin, y, 150, 45)
    } catch {
      // ignore
    }
  }
  if (affidavit.ceoSignature) {
    try {
      doc.addImage(affidavit.ceoSignature, 'PNG', col2X, y, 150, 45)
    } catch {
      // ignore
    }
  }
  y += 55
  doc.line(margin, y, margin + colWidth, y)
  doc.line(col2X, y, col2X + colWidth, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${affidavit.employeeName || '-'}`, margin, y)
  doc.text(`Name: ${affidavit.ceoName || '-'}`, col2X, y)
  y += 18
  doc.text(`Date: ${affidavit.employeeDate ? formatDate(affidavit.employeeDate) : '-'}`, margin, y)
  doc.text(`Date: ${affidavit.ceoDate ? formatDate(affidavit.ceoDate) : '-'}`, col2X, y)

  doc.save(`missing-receipt-affidavit-${affidavit.id.slice(0, 8)}.pdf`)
}
