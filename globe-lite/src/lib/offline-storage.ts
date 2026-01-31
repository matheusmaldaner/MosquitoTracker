const DB_NAME = 'globe-lite-db';
const STORE_NAME = 'pending-observations';

interface PendingObservation {
  id: string;
  timestamp: number;
  protocol: string;
  data: Record<string, any>;
  imageBlob?: Blob;
  status: 'pending' | 'syncing' | 'failed';
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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

// Get count of pending observations
export async function getPendingCount(): Promise<number> {
  const observations = await getPendingObservations();
  return observations.length;
}