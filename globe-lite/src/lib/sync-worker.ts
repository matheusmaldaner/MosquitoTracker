// src/lib/sync-worker.ts
// Sync worker for uploading pending observations

import {
  getPendingObservations,
  removeObservation,
  saveSyncedObservation,
  updateObservationStatus
} from './offline-storage';

const GLOBE_API_UPLOAD_URL = import.meta.env.PUBLIC_GLOBE_UPLOAD_URL || '/api/globe-upload';

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
        await saveSyncedObservation(obs);
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
 * Upload a single observation to GLOBE API via server-side proxy.
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

  if (!GLOBE_API_UPLOAD_URL) {
    throw new Error('Upload endpoint not configured');
  }

  const formData = new FormData();
  formData.append('observationId', observation.id);
  formData.append('protocol', observation.protocol);
  formData.append('data', JSON.stringify(observation.data ?? {}));
  if (observation.imageBlob) {
    formData.append('image', observation.imageBlob, `observation-${observation.id}.webp`);
  }

  const response = await fetch(GLOBE_API_UPLOAD_URL, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(await extractErrorDetails(response));
  }

  console.log(`[Sync] Uploaded observation ${observation.id}`, {
    protocol: observation.protocol,
    data: observation.data,
    hasImage: !!observation.imageBlob,
  });

  return true;
}

async function extractErrorDetails(response: Response): Promise<string> {
  const statusText = response.statusText ? ` ${response.statusText}` : '';
  const contentType = response.headers.get('content-type') || '';
  let details = '';
  let rawText = '';

  try {
    rawText = await response.text();
  } catch {
    rawText = '';
  }

  if (rawText && (contentType.includes('application/json') || contentType.includes('application/stream+json'))) {
    try {
      const body = JSON.parse(rawText);
      if (body?.message) {
        details = body.message;
      } else if (body?.error) {
        details = body.error;
      } else {
        details = JSON.stringify(body);
      }
    } catch {
      details = rawText;
    }
  } else if (rawText) {
    details = rawText;
  }

  return `Upload failed (${response.status}${statusText})${details ? `: ${details}` : ''}`;
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
