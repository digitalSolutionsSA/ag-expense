import { openDB, type IDBPDatabase } from 'idb'
import type { AppSettings, ExpenseItem, ExpenseReport, MissingReceiptAffidavit } from '../types/expense'
import type { Repository } from './repository'

const DB_NAME = 'ag-expenses'
const DB_VERSION = 1

const SETTINGS_KEY = 'settings'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings')
        }
        if (!db.objectStoreNames.contains('reports')) {
          const store = db.createObjectStore('reports', { keyPath: 'id' })
          store.createIndex('by_year_month', ['year', 'month'])
        }
        if (!db.objectStoreNames.contains('items')) {
          const store = db.createObjectStore('items', { keyPath: 'id' })
          store.createIndex('by_report', 'reportId')
        }
        if (!db.objectStoreNames.contains('receiptImages')) {
          db.createObjectStore('receiptImages', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('affidavits')) {
          const store = db.createObjectStore('affidavits', { keyPath: 'id' })
          store.createIndex('by_item', 'expenseItemId')
        }
      },
    })
  }
  return dbPromise
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'House of Holland Tattoo Emporium, LLC',
  staffName: '',
  supervisor: '',
  submitTo: 'Beth Caldwell - beth@consolidatedinsurance.com',
  defaultCardUserName: '',
  currencySymbol: '$',
}

export class IndexedDbRepository implements Repository {
  async getSettings(): Promise<AppSettings> {
    const db = await getDb()
    const stored = await db.get('settings', SETTINGS_KEY)
    return { ...DEFAULT_SETTINGS, ...(stored as AppSettings | undefined) }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await getDb()
    await db.put('settings', settings, SETTINGS_KEY)
  }

  async listReports(): Promise<ExpenseReport[]> {
    const db = await getDb()
    const all = (await db.getAll('reports')) as ExpenseReport[]
    return all.sort((a, b) => (a.year === b.year ? b.month - a.month : b.year - a.year))
  }

  async getReport(id: string): Promise<ExpenseReport | undefined> {
    const db = await getDb()
    return db.get('reports', id) as Promise<ExpenseReport | undefined>
  }

  async getOrCreateReportForDate(date: Date): Promise<ExpenseReport> {
    const db = await getDb()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const tx = db.transaction('reports', 'readonly')
    const index = tx.store.index('by_year_month')
    const existing = (await index.get([year, month])) as ExpenseReport | undefined
    await tx.done
    if (existing) return existing

    const settings = await this.getSettings()
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0)
    const report: ExpenseReport = {
      id: crypto.randomUUID(),
      month,
      year,
      businessName: settings.businessName,
      staffSubmittingReport: settings.staffName,
      supervisor: settings.supervisor,
      reportDateSpanStart: monthStart.toISOString().slice(0, 10),
      reportDateSpanEnd: monthEnd.toISOString().slice(0, 10),
      submitTo: settings.submitTo,
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    await this.saveReport(report)
    return report
  }

  async saveReport(report: ExpenseReport): Promise<void> {
    const db = await getDb()
    await db.put('reports', report)
  }

  async listItemsForReport(reportId: string): Promise<ExpenseItem[]> {
    const db = await getDb()
    const items = (await db.getAllFromIndex('items', 'by_report', reportId)) as ExpenseItem[]
    return items.sort((a, b) => a.entryNumber - b.entryNumber)
  }

  async getItem(id: string): Promise<ExpenseItem | undefined> {
    const db = await getDb()
    return db.get('items', id) as Promise<ExpenseItem | undefined>
  }

  async saveItem(item: ExpenseItem): Promise<void> {
    const db = await getDb()
    await db.put('items', item)
  }

  async deleteItem(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('items', id)
    await db.delete('receiptImages', id)
  }

  async saveReceiptImage(id: string, blob: Blob): Promise<void> {
    const db = await getDb()
    await db.put('receiptImages', { id, blob, createdAt: new Date().toISOString() })
  }

  async getReceiptImage(id: string): Promise<Blob | undefined> {
    const db = await getDb()
    const record = (await db.get('receiptImages', id)) as { blob: Blob } | undefined
    return record?.blob
  }

  async deleteReceiptImage(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('receiptImages', id)
  }

  async saveAffidavit(affidavit: MissingReceiptAffidavit): Promise<void> {
    const db = await getDb()
    await db.put('affidavits', affidavit)
  }

  async getAffidavitForItem(itemId: string): Promise<MissingReceiptAffidavit | undefined> {
    const db = await getDb()
    return db.getFromIndex('affidavits', 'by_item', itemId) as Promise<MissingReceiptAffidavit | undefined>
  }
}
