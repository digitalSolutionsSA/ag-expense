import type { AppSettings, ExpenseItem, ExpenseReport, MissingReceiptAffidavit } from '../types/expense'

/**
 * Storage contract for the app. Implemented today by IndexedDB (`IndexedDbRepository`,
 * fully offline, zero cost). A future `SupabaseRepository` can implement the same
 * interface for cloud sync/multi-device without any UI code changing — see the
 * "Going to the cloud later" section in README.md for the swap-in plan.
 */
export interface Repository {
  getSettings(): Promise<AppSettings>
  saveSettings(settings: AppSettings): Promise<void>

  listReports(): Promise<ExpenseReport[]>
  getReport(id: string): Promise<ExpenseReport | undefined>
  getOrCreateReportForDate(date: Date): Promise<ExpenseReport>
  saveReport(report: ExpenseReport): Promise<void>

  listItemsForReport(reportId: string): Promise<ExpenseItem[]>
  getItem(id: string): Promise<ExpenseItem | undefined>
  saveItem(item: ExpenseItem): Promise<void>
  deleteItem(id: string): Promise<void>

  saveReceiptImage(id: string, blob: Blob): Promise<void>
  getReceiptImage(id: string): Promise<Blob | undefined>
  deleteReceiptImage(id: string): Promise<void>

  saveAffidavit(affidavit: MissingReceiptAffidavit): Promise<void>
  getAffidavitForItem(itemId: string): Promise<MissingReceiptAffidavit | undefined>
}
