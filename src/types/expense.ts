export type ExpenseStatus = 'needs_review' | 'pending' | 'approved'

export type ReportStatus = 'open' | 'submitted' | 'approved'

export type ReceiptMissingReason = 'lost' | 'never_received' | 'other'

export type PaymentForm = 'corporate_card' | 'personal_card' | 'check' | 'cash' | 'other'

export interface ExpenseItem {
  id: string
  reportId: string
  entryNumber: number
  date: string // ISO date (yyyy-mm-dd)
  cardUserName: string
  vendor: string
  expensePurpose: string
  amount: number
  attachedSent: boolean
  status: ExpenseStatus
  ocrRawText?: string
  ocrConfidence?: number
  hasReceiptImage: boolean
  hasAffidavit: boolean
  createdAt: string
}

export interface ExpenseReport {
  id: string
  month: number // 1-12
  year: number
  businessName: string
  staffSubmittingReport: string
  supervisor: string
  reportDateSpanStart: string
  reportDateSpanEnd: string
  submitTo: string
  status: ReportStatus
  requesterSignature?: string // data URL
  requesterSignedDate?: string
  approverSignature?: string // data URL
  approverSignedDate?: string
  createdAt: string
}

export interface MissingReceiptAffidavit {
  id: string
  expenseItemId: string
  missingExpenseDescription: string
  businessLocation: string
  date: string
  amount: number
  receiptStatus: ReceiptMissingReason
  receiptStatusOther?: string
  paymentForm: PaymentForm
  paymentFormOther?: string
  category: string
  personsInvolved?: string
  employeeSignature?: string
  employeeName: string
  employeeDate: string
  ceoSignature?: string
  ceoName: string
  ceoDate: string
}

export interface AppSettings {
  businessName: string
  staffName: string
  supervisor: string
  submitTo: string
  defaultCardUserName: string
  currencySymbol: string
}

export interface ReceiptImageRecord {
  id: string // same as ExpenseItem.id
  blob: Blob
  createdAt: string
}
