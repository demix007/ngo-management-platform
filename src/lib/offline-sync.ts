import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { PendingSync } from '@/types'

export class OfflineSyncManager {
  private isOnline: boolean = navigator.onLine
  private syncInterval: number | null = null

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncPendingChanges()
    })
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
    this.startAutoSync()
  }

  private startAutoSync() {
    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.syncPendingChanges()
      }
    }, 30000)
  }

  async queueSync(
    collectionName: string,
    documentId: string,
    action: 'create' | 'update' | 'delete',
    data?: unknown
  ) {
    if (this.isOnline) {
      try {
        await this.executeSync(collectionName, documentId, action, data)
      } catch {
        // If sync fails, queue it
        await this.addToQueue(collectionName, documentId, action, data)
      }
    } else {
      // Queue for later sync
      await this.addToQueue(collectionName, documentId, action, data)
    }
  }

  private async addToQueue(
    collectionName: string,
    documentId: string,
    action: 'create' | 'update' | 'delete',
    data?: unknown
  ) {
    // Store in IndexedDB for offline persistence
    const pendingSync: Omit<PendingSync, 'id' | 'timestamp'> = {
      collection: collectionName,
      documentId,
      action,
      data,
      retryCount: 0,
      status: 'pending',
    }

    // In a real implementation, use IndexedDB or localStorage
    const syncs = this.getPendingSyncs()
    syncs.push({
      ...pendingSync,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    })
    localStorage.setItem('pendingSyncs', JSON.stringify(syncs))
  }

  private getPendingSyncs(): PendingSync[] {
    const stored = localStorage.getItem('pendingSyncs')
    return stored ? JSON.parse(stored) : []
  }

  private async executeSync(
    collectionName: string,
    documentId: string,
    action: 'create' | 'update' | 'delete',
    data?: unknown
  ) {
    const collectionRef = collection(db, collectionName)

    switch (action) {
      case 'create': {
        if (data) {
          await addDoc(collectionRef, data as Record<string, unknown>)
        }
        break
      }
      case 'update': {
        const docRef = doc(db, collectionName, documentId)
        await updateDoc(docRef, data as Record<string, unknown>)
        break
      }
      case 'delete': {
        const deleteRef = doc(db, collectionName, documentId)
        await deleteDoc(deleteRef)
        break
      }
    }
  }

  async syncPendingChanges() {
    if (!this.isOnline) return

    const pendingSyncs = this.getPendingSyncs()
    const syncedIds: string[] = []

    for (const sync of pendingSyncs) {
      try {
        await this.executeSync(sync.collection, sync.documentId, sync.action, sync.data)
        syncedIds.push(sync.id)
      } catch {
        // Sync failed, will retry later
        // Increment retry count
        sync.retryCount++
        if (sync.retryCount > 5) {
          // Mark as failed after 5 retries
          sync.status = 'failed'
          syncedIds.push(sync.id)
        }
      }
    }

    // Remove synced items
    const remaining = pendingSyncs.filter((s) => !syncedIds.includes(s.id))
    localStorage.setItem('pendingSyncs', JSON.stringify(remaining))
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

export const offlineSyncManager = new OfflineSyncManager()

