<script>
  import { onMount, onDestroy } from 'svelte';
  import {
    Bug,
    Camera,
    CheckCircle2,
    Cloud,
    FileText,
    Info,
    Leaf,
    Loader2,
    MapPin,
    Package,
    RefreshCw,
    Sun,
    TreePine
  } from 'lucide-svelte';

  let observations = [];
  let loading = true;
  let syncing = false;
  let syncMessage = '';
  let isOnline = true;
  let cleanupFunctions = [];

  onMount(async () => {
    if (typeof window === 'undefined') return;
    
    isOnline = navigator.onLine;
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    cleanupFunctions.push(() => window.removeEventListener('online', handleOnline));
    cleanupFunctions.push(() => window.removeEventListener('offline', handleOffline));
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      cleanupFunctions.push(() => navigator.serviceWorker.removeEventListener('message', handleSWMessage));
    }

    await loadObservations();
  });

  onDestroy(() => {
    cleanupFunctions.forEach(fn => fn());
  });

  function handleOnline() {
    isOnline = true;
  }

  function handleOffline() {
    isOnline = false;
  }

  function handleSWMessage(event) {
    if (event.data.type === 'SYNC_STARTED') {
      syncing = true;
      syncMessage = 'Syncing...';
    } else if (event.data.type === 'SYNC_COMPLETE') {
      syncing = false;
      const { success, failed } = event.data.data;
      syncMessage = `Synced ${success} observation${success !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`;
      loadObservations();
      setTimeout(() => { syncMessage = ''; }, 3000);
    } else if (event.data.type === 'SYNC_ERROR') {
      syncing = false;
      syncMessage = 'Sync failed: ' + event.data.error;
    }
  }

  async function loadObservations() {
    loading = true;
    try {
      const { getPendingObservations } = await import('../lib/offline-storage');
      observations = await getPendingObservations();
      observations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to load observations:', error);
    } finally {
      loading = false;
    }
  }

  async function deleteObservation(id) {
    if (!confirm('Delete this observation? This cannot be undone.')) return;

    try {
      const { removeObservation } = await import('../lib/offline-storage');
      await removeObservation(id);
      await loadObservations();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  async function retryObservation(id) {
    try {
      const { updateObservationStatus } = await import('../lib/offline-storage');
      await updateObservationStatus(id, 'pending');
      await loadObservations();
      triggerSync();
    } catch (error) {
      console.error('Failed to retry:', error);
    }
  }

  async function syncNow() {
    if (!isOnline) {
      syncMessage = 'No internet connection';
      setTimeout(() => { syncMessage = ''; }, 2000);
      return;
    }

    syncing = true;
    syncMessage = 'Starting sync...';

    try {
      const { syncAllObservations } = await import('../lib/sync-worker');
      const result = await syncAllObservations((progress) => {
        syncMessage = `Syncing... ${progress.completed + progress.failed}/${progress.total}`;
      });

      syncMessage = `Done! ${result.completed} synced, ${result.failed} failed`;
      await loadObservations();
      setTimeout(() => { syncMessage = ''; }, 3000);
    } catch (error) {
      syncMessage = 'Sync failed: ' + error.message;
    } finally {
      syncing = false;
    }
  }

  function triggerSync() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_SYNC' });
    }
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  function formatBytes(bytes) {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getStatusColor(status) {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'syncing': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'pending': return 'Pending';
      case 'syncing': return 'Syncing...';
      case 'failed': return 'Failed';
      default: return status;
    }
  }

  function getProtocolIcon(protocol) {
    const icons = {
      clouds: Cloud,
      mosquito_habitat_mapper: Bug,
      land_covers: Leaf,
      tree_heights: TreePine,
      sky_conditions: Sun,
    };
    return icons[protocol] || FileText;
  }
</script>

<div class="space-y-6">
  <!-- Header with sync controls -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h2 class="text-2xl font-bold text-globe-text">Pending Uploads</h2>
      <p class="text-globe-muted text-sm mt-1">
        {observations.length} observation{observations.length !== 1 ? 's' : ''} waiting to sync
      </p>
    </div>

    <div class="flex items-center gap-3">
      <!-- Online status indicator -->
      <div class="flex items-center gap-2 text-sm">
        <span class="w-2 h-2 rounded-full {isOnline ? 'bg-green-500' : 'bg-red-500'}"></span>
        <span class="text-globe-muted">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      <!-- Sync button -->
      <button
        class="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
          {syncing || !isOnline || observations.length === 0
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-nasa-blue hover:bg-nasa-dark text-white'}"
        disabled={syncing || !isOnline || observations.length === 0}
        on:click={syncNow}
      >
        {#if syncing}
          <Loader2 class="w-4 h-4 animate-spin" />
        {:else}
          <RefreshCw class="w-4 h-4" />
        {/if}
        Sync Now
      </button>
    </div>
  </div>

  <!-- Sync message -->
  {#if syncMessage}
    <div class="p-3 rounded-lg bg-nasa-blue/10 text-nasa-blue text-sm">
      {syncMessage}
    </div>
  {/if}

  <!-- Loading state -->
  {#if loading}
    <div class="text-center py-12">
      <Loader2 class="w-10 h-10 mx-auto animate-spin text-globe-muted" />
      <p class="text-globe-muted mt-4">Loading...</p>
    </div>
  {:else if observations.length === 0}
    <!-- Empty state -->
    <div class="glass-card p-12 text-center">
      <CheckCircle2 class="w-12 h-12 mx-auto text-green-500" />
      <h3 class="text-xl font-semibold mt-4 text-globe-text">All caught up!</h3>
      <p class="text-globe-muted mt-2">No pending observations to sync.</p>
      <a
        href="/observe"
        class="inline-block mt-6 px-6 py-3 bg-nasa-blue text-white rounded-lg hover:bg-nasa-dark transition-colors"
      >
        <span class="inline-flex items-center gap-2">
          <Camera class="w-4 h-4" />
          Capture New Observation
        </span>
      </a>
    </div>
  {:else}
    <!-- Observations list -->
    <div class="space-y-4">
      {#each observations as obs (obs.id)}
        <div class="glass-card p-4">
          <div class="flex items-start gap-4">
            <!-- Protocol icon -->
            <div class="text-3xl flex-shrink-0">
              <svelte:component
                this={getProtocolIcon(obs.protocol)}
                class="w-8 h-8 text-globe-text"
              />
            </div>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-globe-text capitalize">
                  {obs.protocol.replace(/_/g, ' ')}
                </span>
                <span class="px-2 py-0.5 text-xs rounded-full text-white {getStatusColor(obs.status)}">
                  {getStatusText(obs.status)}
                </span>
              </div>

              <p class="text-sm text-globe-muted">
                {formatDate(obs.timestamp)}
              </p>

              {#if obs.data}
                <div class="mt-2 text-sm text-globe-muted">
                  {#if obs.data.latitude && obs.data.longitude}
                    <span class="inline-flex items-center gap-1">
                      <MapPin class="w-4 h-4" />
                      {obs.data.latitude.toFixed(4)}, {obs.data.longitude.toFixed(4)}
                    </span>
                  {/if}
                  {#if obs.data.imageSize}
                    <span class="ml-3 inline-flex items-center gap-1">
                      <Package class="w-4 h-4" />
                      {formatBytes(obs.data.imageSize)}
                    </span>
                  {/if}
                </div>
              {/if}

              {#if obs.data?.notes}
                <p class="mt-2 text-sm text-globe-text italic">"{obs.data.notes}"</p>
              {/if}
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-2">
              {#if obs.status === 'failed'}
                <button
                  class="px-3 py-1.5 text-sm rounded bg-nasa-blue text-white hover:bg-nasa-dark"
                  on:click={() => retryObservation(obs.id)}
                >
                  Retry
                </button>
              {/if}
              <button
                class="px-3 py-1.5 text-sm rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                on:click={() => deleteObservation(obs.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Info box -->
  <div class="glass-card p-4 mt-6">
    <h3 class="font-semibold text-globe-text mb-2 inline-flex items-center gap-2">
      <Info class="w-4 h-4" />
      How syncing works
    </h3>
    <ul class="text-sm text-globe-muted space-y-1 list-disc list-inside">
      <li>Observations are saved locally on your device</li>
      <li>When online, they automatically sync to GLOBE servers</li>
      <li>You can also manually trigger sync with the button above</li>
      <li>Failed uploads can be retried individually</li>
    </ul>
  </div>
</div>
