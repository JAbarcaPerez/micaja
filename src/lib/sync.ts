import { db } from '@/db/database'
import type { BackupPayload } from '@/types'

const BACKUP_VERSION = 1

export async function exportBackup(userId?: number): Promise<BackupPayload> {
  const [accounts, categories, transactions, savingsGoals, loans] = await Promise.all([
    db.accounts.toArray(),
    db.categories.toArray(),
    db.transactions.toArray(),
    db.savingsGoals.toArray(),
    db.loans.toArray(),
  ])

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    userId,
    accounts,
    categories,
    transactions,
    savingsGoals,
    loans,
  }
}

export async function importBackup(payload: BackupPayload, replace = true): Promise<void> {
  if (payload.version !== BACKUP_VERSION) {
    throw new Error('Versión de backup no compatible')
  }

  await db.transaction('rw', [
    db.accounts,
    db.categories,
    db.transactions,
    db.savingsGoals,
    db.loans,
  ], async () => {
    if (replace) {
      await db.transactions.clear()
      await db.savingsGoals.clear()
      await db.loans.clear()
      await db.categories.clear()
      await db.accounts.clear()
    }

    if (payload.accounts.length > 0) await db.accounts.bulkPut(payload.accounts)
    if (payload.categories.length > 0) await db.categories.bulkPut(payload.categories)
    if (payload.transactions.length > 0) await db.transactions.bulkPut(payload.transactions)
    if (payload.savingsGoals.length > 0) await db.savingsGoals.bulkPut(payload.savingsGoals)
    if (payload.loans.length > 0) await db.loans.bulkPut(payload.loans)
  })
}

export function downloadBackup(payload: BackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `micaja-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function parseBackupFile(file: File): Promise<BackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupPayload
        if (!data.version || !data.accounts) {
          reject(new Error('Archivo de backup inválido'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('No se pudo leer el archivo'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}

export async function syncToCloud(
  endpointUrl: string,
  apiToken: string,
  payload: BackupPayload
): Promise<void> {
  const response = await fetch(endpointUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Error de sincronización (${response.status})`)
  }
}

export async function syncFromCloud(
  endpointUrl: string,
  apiToken: string
): Promise<BackupPayload> {
  const response = await fetch(endpointUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Error al descargar (${response.status})`)
  }

  const data = (await response.json()) as BackupPayload
  if (!data.version || !data.accounts) {
    throw new Error('Respuesta del servidor inválida')
  }

  return data
}
