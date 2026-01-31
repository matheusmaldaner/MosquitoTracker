<script>
  import { onMount } from 'svelte';
  import imageCompression from 'browser-image-compression';

  // Props
  export let onSubmitSuccess = () => {};

  // Form state
  let protocol = 'clouds';
  let notes = '';
  let latitude = null;
  let longitude = null;
  let locationStatus = 'idle'; // idle | loading | success | error
  let locationError = '';

  // Image state
  let imageBlob = null;
  let imagePreview = '';
  let imageStatus = 'idle'; // idle | compressing | ready | error
  let originalSize = 0;
  let compressedSize = 0;
  let compressionRatio = 0;

  // Submit state
  let submitting = false;
  let submitMessage = '';
  let submitError = false;

  const protocols = [
    { id: 'clouds', name: 'Clouds', icon: '☁️' },
    { id: 'mosquito_habitat_mapper', name: 'Mosquito Habitat', icon: '🦟' },
    { id: 'land_covers', name: 'Land Cover', icon: '🌿' },
    { id: 'tree_heights', name: 'Tree Heights', icon: '🌲' },
    { id: 'sky_conditions', name: 'Sky Conditions', icon: '🌤️' },
  ];

  onMount(() => {
    getLocation();
  });

  function getLocation() {
    if (!navigator.geolocation) {
      locationStatus = 'error';
      locationError = 'Geolocation not supported';
      return;
    }

    locationStatus = 'loading';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        locationStatus = 'success';
      },
      (error) => {
        locationStatus = 'error';
        locationError = error.message;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    imageStatus = 'compressing';
    originalSize = file.size;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/webp',
      };

      const compressed = await imageCompression(file, options);
      compressedSize = compressed.size;
      compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

      imageBlob = compressed;
      imagePreview = URL.createObjectURL(compressed);
      imageStatus = 'ready';
    } catch (error) {
      imageStatus = 'error';
      console.error('Compression failed:', error);
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  async function handleSubmit() {
    if (!imageBlob) {
      submitMessage = 'Please capture or select an image';
      submitError = true;
      return;
    }

    if (locationStatus !== 'success') {
      submitMessage = 'Location required. Please enable location access.';
      submitError = true;
      return;
    }

    submitting = true;
    submitMessage = '';
    submitError = false;

    try {
      // Dynamic import for offline storage
      const { queueObservation } = await import('../lib/offline-storage');

      const observationId = await queueObservation({
        protocol,
        data: {
          notes,
          latitude,
          longitude,
          capturedAt: new Date().toISOString(),
          imageSize: compressedSize,
          compressionRatio,
        },
        imageBlob,
      });

      submitMessage = `Observation queued! ID: ${observationId.slice(0, 8)}...`;
      submitError = false;

      // Try to register background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-observations');
      }

      // Reset form
      setTimeout(() => {
        protocol = 'clouds';
        notes = '';
        imageBlob = null;
        imagePreview = '';
        imageStatus = 'idle';
        submitMessage = '';
        onSubmitSuccess();
      }, 2000);
    } catch (error) {
      submitMessage = 'Failed to queue observation: ' + error.message;
      submitError = true;
    } finally {
      submitting = false;
    }
  }

  function clearImage() {
    imageBlob = null;
    imagePreview = '';
    imageStatus = 'idle';
    originalSize = 0;
    compressedSize = 0;
    compressionRatio = 0;
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <!-- Protocol Selection -->
  <div>
    <label class="block text-sm font-medium text-globe-text mb-2">Protocol</label>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {#each protocols as p}
        <button
          type="button"
          class="p-3 rounded-lg border-2 transition-all text-left {protocol === p.id
            ? 'border-nasa-blue bg-nasa-blue/10'
            : 'border-[color:var(--glass-border)] hover:border-nasa-blue/50'}"
          on:click={() => (protocol = p.id)}
        >
          <span class="text-xl">{p.icon}</span>
          <span class="block text-sm mt-1">{p.name}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Location -->
  <div>
    <label class="block text-sm font-medium text-globe-text mb-2">Location</label>
    <div class="glass-card p-4">
      {#if locationStatus === 'loading'}
        <div class="flex items-center gap-2 text-globe-muted">
          <span class="animate-spin">📍</span>
          Getting location...
        </div>
      {:else if locationStatus === 'success'}
        <div class="flex items-center justify-between">
          <div class="text-sm">
            <span class="text-globe-muted">Lat:</span> {latitude?.toFixed(5)}
            <span class="text-globe-muted ml-3">Lng:</span> {longitude?.toFixed(5)}
          </div>
          <button
            type="button"
            class="text-nasa-blue hover:underline text-sm"
            on:click={getLocation}
          >
            Refresh
          </button>
        </div>
      {:else if locationStatus === 'error'}
        <div class="flex items-center justify-between">
          <span class="text-nasa-red text-sm">{locationError}</span>
          <button
            type="button"
            class="text-nasa-blue hover:underline text-sm"
            on:click={getLocation}
          >
            Retry
          </button>
        </div>
      {:else}
        <button
          type="button"
          class="text-nasa-blue hover:underline"
          on:click={getLocation}
        >
          📍 Get Location
        </button>
      {/if}
    </div>
  </div>

  <!-- Image Capture -->
  <div>
    <label class="block text-sm font-medium text-globe-text mb-2">Photo</label>
    {#if imageStatus === 'idle'}
      <label class="block cursor-pointer">
        <div class="glass-card p-8 text-center border-2 border-dashed border-[color:var(--glass-border)] hover:border-nasa-blue transition-colors">
          <span class="text-4xl">📷</span>
          <p class="text-globe-muted mt-2">Tap to capture or select photo</p>
        </div>
        <input
          type="file"
          class="hidden"
          accept="image/*"
          capture="environment"
          on:change={handleImageSelect}
        />
      </label>
    {:else if imageStatus === 'compressing'}
      <div class="glass-card p-8 text-center">
        <div class="animate-spin text-4xl mb-2">⏳</div>
        <p class="text-globe-muted">Compressing image...</p>
        <div class="w-full bg-[color:var(--surface-soft)] rounded-full h-2 mt-3">
          <div class="bg-nasa-blue h-2 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    {:else if imageStatus === 'ready'}
      <div class="glass-card p-4">
        <div class="relative">
          <img src={imagePreview} alt="Preview" class="w-full h-48 object-cover rounded-lg" />
          <button
            type="button"
            class="absolute top-2 right-2 bg-nasa-red text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-700"
            on:click={clearImage}
          >
            ✕
          </button>
        </div>
        <div class="mt-3 text-sm text-globe-muted flex justify-between">
          <span>Original: {formatBytes(originalSize)}</span>
          <span>Compressed: {formatBytes(compressedSize)}</span>
          <span class="text-nasa-green font-bold">{compressionRatio}% saved</span>
        </div>
      </div>
    {:else if imageStatus === 'error'}
      <div class="glass-card p-4 text-center">
        <p class="text-nasa-red">Failed to process image</p>
        <button
          type="button"
          class="mt-2 text-nasa-blue hover:underline"
          on:click={clearImage}
        >
          Try again
        </button>
      </div>
    {/if}
  </div>

  <!-- Notes -->
  <div>
    <label for="notes" class="block text-sm font-medium text-globe-text mb-2">Notes (optional)</label>
    <textarea
      id="notes"
      bind:value={notes}
      rows="3"
      placeholder="Additional observations..."
      class="w-full px-4 py-3 rounded-lg bg-[color:var(--surface-soft)] border border-[color:var(--glass-border)] focus:border-nasa-blue focus:outline-none text-globe-text placeholder-globe-muted"
    ></textarea>
  </div>

  <!-- Submit Message -->
  {#if submitMessage}
    <div class="p-4 rounded-lg {submitError ? 'bg-nasa-red/10 text-nasa-red' : 'bg-nasa-green/10 text-nasa-green'}">
      {submitMessage}
    </div>
  {/if}

  <!-- Submit Button -->
  <button
    type="submit"
    disabled={submitting || imageStatus !== 'ready' || locationStatus !== 'success'}
    class="w-full py-4 rounded-lg font-semibold text-white transition-all
      {submitting || imageStatus !== 'ready' || locationStatus !== 'success'
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-nasa-blue hover:bg-nasa-dark'}"
  >
    {#if submitting}
      <span class="animate-spin inline-block mr-2">⏳</span>
      Saving...
    {:else}
      📤 Queue Observation
    {/if}
  </button>

  <p class="text-center text-sm text-globe-muted">
    Observations are saved locally and synced when online
  </p>
</form>
