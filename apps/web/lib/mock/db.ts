import { createSeedDatabase, MOCK_STORAGE_KEY } from "./seed"
import type { MockDatabase } from "./types"

let memoryDb: MockDatabase | null = null

const canUseStorage = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const readFromStorage = (): MockDatabase | null => {
  if (!canUseStorage()) return null
  const raw = window.localStorage.getItem(MOCK_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as MockDatabase
    if (parsed?.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

const writeToStorage = (db: MockDatabase): void => {
  if (!canUseStorage()) return
  window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db))
}

export const getMockDb = (): MockDatabase => {
  if (memoryDb) return memoryDb
  const stored = readFromStorage()
  memoryDb = stored ?? createSeedDatabase()
  if (!stored) writeToStorage(memoryDb)
  return memoryDb
}

export const setMockDb = (next: MockDatabase): MockDatabase => {
  memoryDb = next
  writeToStorage(next)
  return memoryDb
}

export const updateMockDb = (
  updater: (db: MockDatabase) => MockDatabase
): MockDatabase => {
  const current = clone(getMockDb())
  return setMockDb(updater(current))
}

export const resetMockDb = (): MockDatabase => {
  memoryDb = createSeedDatabase()
  writeToStorage(memoryDb)
  return memoryDb
}

export const newMockId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
