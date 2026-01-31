<script>
  import { onMount } from 'svelte';
  import { getRecentMosquitoObservations } from '../lib/globe-api';

  let observations = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const data = await getRecentMosquitoObservations(true);
      observations = data.features.slice(0, 10); // Show first 10
      loading = false;
    } catch (e) {
      error = e?.message || 'Failed to load observations';
      loading = false;
    }
  });
</script>

<div class="space-y-4">
  {#if loading}
    <div class="glass-card p-4" style="color: var(--text-muted);">Loading observations...</div>
  {:else if error}
    <div class="glass-card p-4" style="border: 1px solid var(--danger); color: var(--danger);">Error: {error}</div>
  {:else}
    <ul class="space-y-4">
      {#each observations as obs}
        <li class="glass-card p-4 text-sm">
          <p><strong style="color: var(--text-primary);">Protocol:</strong> {obs.properties.protocol}</p>
          <p><strong style="color: var(--text-primary);">Date:</strong> {new Date(obs.properties.measuredDate).toLocaleDateString()}</p>
          <p style="color: var(--text-muted);"><strong style="color: var(--text-primary);">Location:</strong> {obs.geometry.coordinates[1]}, {obs.geometry.coordinates[0]}</p>
        </li>
      {/each}
    </ul>
  {/if}
</div>
