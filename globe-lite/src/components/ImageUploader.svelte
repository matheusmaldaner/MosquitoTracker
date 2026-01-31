<script>
  import imageCompression from 'browser-image-compression';

  export let onImageReady = (blob, metadata) => {};
  export let maxSizeMB = 0.5;  // 500KB max
  export let maxDimension = 1024;

  let status = 'idle'; // idle | compressing | ready | error
  let originalSize = 0;
  let compressedSize = 0;
  let previewUrl = '';
  let compressionRatio = 0;
  let compressedBlob = null;

  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    status = 'compressing';
    originalSize = file.size;

    try {
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        fileType: 'image/webp', // Use WebP for better compression
      };

      const compressed = await imageCompression(file, options);
      compressedBlob = compressed;
      compressedSize = compressed.size;
      compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

      previewUrl = URL.createObjectURL(compressed);
      status = 'ready';

      onImageReady(compressed, {
        originalSize,
        compressedSize,
        compressionRatio,
        width: maxDimension,
        format: 'webp'
      });
    } catch (error) {
      status = 'error';
      console.error('Compression failed:', error);
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function downloadImage() {
    if (!compressedBlob) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `compressed-${Date.now()}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function reset() {
    status = 'idle';
    originalSize = 0;
    compressedSize = 0;
    compressionRatio = 0;
    compressedBlob = null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }
  }
</script>

<div class="w-full max-w-lg mx-auto">
  <label for="file-upload" class="cursor-pointer">
    <div class="glass-card p-8 text-center border-2 border-dashed" style="border-color: var(--border); transition: border-color 0.3s;">
      {#if status === 'idle'}
        <p style="color: var(--text-muted);">Tap to select or take a photo</p>
      {:else if status === 'compressing'}
        <p style="color: var(--text-primary);">Compressing...</p>
        <div class="w-full rounded-full h-2.5 mt-2" style="background: var(--bg-tertiary);">
          <div class="h-2.5 rounded-full animate-pulse" style="background: var(--accent);"></div>
        </div>
      {:else if status === 'ready'}
        <img src={previewUrl} alt="Preview" class="mx-auto h-32 rounded-lg"/>
        <p class="mt-2 text-sm" style="color: var(--text-muted);">
          Original: {formatBytes(originalSize)} | Compressed: {formatBytes(compressedSize)}
          <span class="font-bold ml-2" style="color: var(--accent);">({compressionRatio}% reduction)</span>
        </p>
        <div class="flex gap-3 justify-center mt-4">
          <button
            on:click|stopPropagation={downloadImage}
            class="px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            style="background: var(--accent); color: var(--bg-primary);"
          >
            Download Compressed
          </button>
          <button
            on:click|stopPropagation={reset}
            class="px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            style="background: var(--bg-tertiary); color: var(--text-primary);"
          >
            Try Another
          </button>
        </div>
      {:else if status === 'error'}
        <p style="color: var(--danger);">Compression failed. Please try another image.</p>
      {/if}
    </div>
  </label>
  <input id="file-upload" type="file" class="hidden" accept="image/*" capture="environment" on:change={handleFileSelect} />
</div>

<style>
  .glass-card:hover {
    border-color: var(--accent) !important;
  }
</style>
