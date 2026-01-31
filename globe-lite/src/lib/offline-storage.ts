const DB_NAME = 'globe-lite-db';
const STORE_NAME = 'pending-observations';
const SYNCED_STORE = 'synced-observations';

interface PendingObservation {
  id: string;
  timestamp: number;
  protocol: string;
  data: Record<string, any>;
  imageBlob?: Blob;
  status: 'pending' | 'syncing' | 'failed';
}

interface SyncedObservation extends Omit<PendingObservation, 'status'> {
  status: 'synced';
  syncedAt: number;
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SYNCED_STORE)) {
        db.createObjectStore(SYNCED_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Save observation for later sync
export async function queueObservation(
  observation: Omit<PendingObservation, 'id' | 'timestamp' | 'status'>
): Promise<string> {
  const db = await openDB();
  const id = crypto.randomUUID();

  const pending: PendingObservation = {
    ...observation,
    id,
    timestamp: Date.now(),
    status: 'pending'
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(pending);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

// Get all pending observations
export async function getPendingObservations(): Promise<PendingObservation[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Remove observation after successful sync
export async function removeObservation(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save observation to synced history
export async function saveSyncedObservation(
  observation: PendingObservation
): Promise<void> {
  const db = await openDB();
  const synced: SyncedObservation = {
    ...observation,
    status: 'synced',
    syncedAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNCED_STORE, 'readwrite');
    const store = tx.objectStore(SYNCED_STORE);
    const request = store.put(synced);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get synced observation history
export async function getSyncedObservations(): Promise<SyncedObservation[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNCED_STORE, 'readonly');
    const store = tx.objectStore(SYNCED_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Update observation status
export async function updateObservationStatus(
  id: string,
  status: 'pending' | 'syncing' | 'failed'
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const observation = getRequest.result;
      if (observation) {
        observation.status = status;
        const putRequest = store.put(observation);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Observation not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Get count of pending observations
export async function getPendingCount(): Promise<number> {
  const observations = await getPendingObservations();
  return observations.length;
}
