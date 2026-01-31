<script>
  import { onMount, onDestroy } from 'svelte';

  let observations = [];
  let loading = true;
  let error = '';
  const imageUrls = new Map();

  onMount(async () => {
    if (typeof window === 'undefined') return;
    await loadObservations();
  });

  onDestroy(() => {
    cleanupImageUrls();
  });

  function cleanupImageUrls() {
    imageUrls.forEach((url) => URL.revokeObjectURL(url));
    imageUrls.clear();
  }

  async function loadObservations() {
    loading = true;
    error = '';
    cleanupImageUrls();

    try {
      const { getPendingObservations, getSyncedObservations } = await import('../lib/offline-storage');
      const [pending, synced] = await Promise.all([
        getPendingObservations(),
        getSyncedObservations()
      ]);

      const merged = [...synced, ...pending];
      merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      observations = merged.map((obs) => {
        let imageUrl = '';
        if (obs.imageBlob) {
          imageUrl = URL.createObjectURL(obs.imageBlob);
          imageUrls.set(obs.id, imageUrl);
        }
        return { ...obs, imageUrl };
      });
    } catch (err) {
      error = err?.message || 'Failed to load observations';
    } finally {
      loading = false;
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
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
      case 'synced': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'pending': return 'Pending';
      case 'syncing': return 'Syncing...';
      case 'failed': return 'Failed';
      case 'synced': return 'Synced';
      default: return status;
    }
  }

  function getProtocolEmoji(protocol) {
    const emojis = {
      clouds: '☁️',
      mosquito_habitat_mapper: '🦟',
      land_covers: '🌿',
      tree_heights: '🌲',
      sky_conditions: '🌤️',
    };
    return emojis[protocol] || '📋';
  }
</script>

<div class="space-y-6">
  {#if loading}
    <div class="text-center py-12">
      <span class="text-4xl animate-spin inline-block">⏳</span>
      <p class="text-globe-muted mt-4">Loading observations...</p>
    </div>
  {:else if error}
    <div class="glass-card p-4" style="border: 1px solid var(--danger); color: var(--danger);">
      Error: {error}
    </div>
  {:else if observations.length === 0}
    <div class="glass-panel p-10 text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-[color:var(--accent-dim)] flex items-center justify-center">
        <span class="text-4xl">📷</span>
      </div>
      <h2 class="text-xl font-semibold text-globe-text mb-2">No Observations Yet</h2>
      <p class="text-globe-muted mb-6">Start observing to see your submissions here.</p>
      <a href="/observe" class="primary-btn">Start Observing</a>
    </div>
  {:else}
    <div class="grid gap-4">
      {#each observations as obs (obs.id)}
        <div class="glass-card p-4">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="w-full md:w-40 flex-shrink-0">
              {#if obs.imageUrl}
                <img src={obs.imageUrl} alt="Observation" class="w-full h-32 object-cover rounded-lg" />
              {:else}
                <div class="w-full h-32 rounded-lg bg-[color:var(--surface-soft)] flex items-center justify-center text-3xl">
                  {getProtocolEmoji(obs.protocol)}
                </div>
              {/if}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg font-semibold text-globe-text capitalize">
                  {obs.protocol?.replace(/_/g, ' ')}
                </span>
                <span class="px-2 py-0.5 text-xs rounded-full text-white {getStatusColor(obs.status)}">
                  {getStatusText(obs.status)}
                </span>
              </div>

              <p class="text-sm text-globe-muted">Captured: {formatDate(obs.timestamp)}</p>
              {#if obs.syncedAt}
                <p class="text-sm text-globe-muted">Synced: {formatDate(obs.syncedAt)}</p>
              {/if}

              {#if obs.data}
                <div class="mt-2 text-sm text-globe-muted">
                  {#if obs.data.latitude && obs.data.longitude}
                    <span>📍 {obs.data.latitude.toFixed(4)}, {obs.data.longitude.toFixed(4)}</span>
                  {/if}
                  {#if obs.data.imageSize}
                    <span class="ml-3">📦 {formatBytes(obs.data.imageSize)}</span>
                  {/if}
                </div>
              {/if}

              {#if obs.data?.notes}
                <p class="mt-2 text-sm text-globe-text italic">"{obs.data.notes}"</p>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
