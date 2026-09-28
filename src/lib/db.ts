import { IndexedDbRepository } from './indexedDbRepository'
import type { Repository } from './repository'

// Single swap point for a future Supabase-backed repository — everything else in
// the app talks to `Repository`, never to IndexedDB or Supabase directly.
export const repo: Repository = new IndexedDbRepository()
