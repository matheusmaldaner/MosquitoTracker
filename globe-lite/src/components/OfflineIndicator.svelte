<script>
  import { onMount } from 'svelte';
  import { getPendingCount } from '../lib/offline-storage';

  let isOnline = true;
  let pendingCount = 0;

  onMount(() => {
    isOnline = navigator.onLine;

    const handleOnline = () => {
      isOnline = true;
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.sync.register('sync-observations');
        });
      }
    };

    const handleOffline = () => {
      isOnline = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updatePending = async () => {
      pendingCount = await getPendingCount();
    };

    updatePending();
    const interval = setInterval(updatePending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  });
</script>

{#if !isOnline || pendingCount > 0}
  <div class="fixed bottom-4 right-4 glass-card px-4 py-2 text-sm">
    <div class="flex items-center gap-2 text-globe-text">
      {#if !isOnline}
        <span class="inline-flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          Offline Mode
        </span>
      {/if}
      {#if pendingCount > 0}
        <span class="inline-flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-nasa-cyan"></span>
          {pendingCount} pending
        </span>
      {/if}
    </div>
  </div>
{/if}
