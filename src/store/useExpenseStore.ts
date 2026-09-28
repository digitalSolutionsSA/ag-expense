import { create } from 'zustand'
import { repo } from '../lib/db'
import type { AppSettings, ExpenseItem, ExpenseReport } from '../types/expense'

interface ExpenseStoreState {
  settings: AppSettings | null
  currentReport: ExpenseReport | null
  items: ExpenseItem[]
  loading: boolean

  init: () => Promise<void>
  loadReportForDate: (date: Date) => Promise<void>
  refreshItems: () => Promise<void>
  addOrUpdateItem: (item: ExpenseItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateSettings: (settings: AppSettings) => Promise<void>
  updateReport: (report: ExpenseReport) => Promise<void>
}

let initPromise: Promise<void> | null = null

export const useExpenseStore = create<ExpenseStoreState>((set, get) => ({
  settings: null,
  currentReport: null,
  items: [],
  loading: true,

  init: async () => {
    if (initPromise) return initPromise
    initPromise = (async () => {
      set({ loading: true })
      const settings = await repo.getSettings()
      set({ settings })
      await get().loadReportForDate(new Date())
      set({ loading: false })
    })()
    return initPromise
  },

  loadReportForDate: async (date: Date) => {
    const report = await repo.getOrCreateReportForDate(date)
    set({ currentReport: report })
    await get().refreshItems()
  },

  refreshItems: async () => {
    const report = get().currentReport
    if (!report) return
    const items = await repo.listItemsForReport(report.id)
    set({ items })
  },

  addOrUpdateItem: async (item: ExpenseItem) => {
    await repo.saveItem(item)
    await get().refreshItems()
  },

  removeItem: async (id: string) => {
    await repo.deleteItem(id)
    await get().refreshItems()
  },

  updateSettings: async (settings: AppSettings) => {
    await repo.saveSettings(settings)
    set({ settings })
  },

  updateReport: async (report: ExpenseReport) => {
    await repo.saveReport(report)
    set({ currentReport: report })
  },
}))
