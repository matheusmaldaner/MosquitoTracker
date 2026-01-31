// src/lib/sync-worker.ts
// Sync worker for uploading pending observations

import { getPendingObservations, removeObservation, updateObservationStatus } from './offline-storage';

const GLOBE_API_UPLOAD_URL = 'https://api.globe.gov/search/v1/upload'; // Placeholder - actual endpoint needs API key

export interface SyncResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  results: SyncResult[];
}

type ProgressCallback = (progress: SyncProgress) => void;

/**
 * Attempt to sync all pending observations
 */
export async function syncAllObservations(
  onProgress?: ProgressCallback
): Promise<SyncProgress> {
  const observations = await getPendingObservations();
  
  const progress: SyncProgress = {
    total: observations.length,
    completed: 0,
    failed: 0,
    results: [],
  };

  if (observations.length === 0) {
    return progress;
  }

  for (const obs of observations) {
    try {
      // Mark as syncing
      await updateObservationStatus(obs.id, 'syncing');

      // Attempt upload
      const success = await uploadObservation(obs);

      if (success) {
        await removeObservation(obs.id);
        progress.completed++;
        progress.results.push({ id: obs.id, success: true });
      } else {
        await updateObservationStatus(obs.id, 'failed');
        progress.failed++;
        progress.results.push({ id: obs.id, success: false, error: 'Upload failed' });
      }
    } catch (error) {
      await updateObservationStatus(obs.id, 'failed');
      progress.failed++;
      progress.results.push({
        id: obs.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    onProgress?.(progress);
  }

  return progress;
}

/**
 * Upload a single observation to GLOBE API
 * Note: This is a placeholder - actual GLOBE API requires developer key
 */
async function uploadObservation(observation: {
  id: string;
  protocol: string;
  data: Record<string, unknown>;
  imageBlob?: Blob;
}): Promise<boolean> {
  // Check if online
  if (!navigator.onLine) {
    throw new Error('No internet connection');
  }

  // In a real implementation, this would:
  // 1. Create FormData with observation data
  // 2. Attach the image blob
  // 3. POST to GLOBE API with API key
  // 4. Handle response

  // For demo purposes, simulate upload with delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulate 90% success rate for demo
  const success = Math.random() > 0.1;
  
  if (!success) {
    throw new Error('Simulated upload failure');
  }

  console.log(`[Sync] Uploaded observation ${observation.id}`, {
    protocol: observation.protocol,
    data: observation.data,
    hasImage: !!observation.imageBlob,
  });

  return true;
}

/**
 * Check if there are pending observations to sync
 */
export async function hasPendingSync(): Promise<boolean> {
  const observations = await getPendingObservations();
  return observations.length > 0;
}

/**
 * Get count of observations by status
 */
export async function getSyncStats(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
}> {
  const observations = await getPendingObservations();
  return {
    pending: observations.filter((o) => o.status === 'pending').length,
    syncing: observations.filter((o) => o.status === 'syncing').length,
    failed: observations.filter((o) => o.status === 'failed').length,
  };
}

/**
 * Auto-sync when coming online
 */
export function setupAutoSync(onProgress?: ProgressCallback): () => void {
  const handleOnline = async () => {
    console.log('[Sync] Connection restored, attempting sync...');
    await syncAllObservations(onProgress);
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
