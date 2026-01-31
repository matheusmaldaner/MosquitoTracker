# GLOBE Observer Lite

> 🌍 Fast, offline-first citizen science for everyone — optimized for low-bandwidth connections.

[![Astro](https://img.shields.io/badge/Astro-5.17-FF5D01?logo=astro)](https://astro.build)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte)](https://svelte.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor)](https://capacitorjs.com)

## 🚀 Overview

GLOBE Observer Lite is a lightweight reimagining of the NASA GLOBE Observer app, built to work in areas with limited or intermittent connectivity. The app enables citizen scientists worldwide to contribute environmental observations even on 2G networks.

### Key Features

- **📦 Ultra-lightweight**: < 200KB initial load (vs 2-5MB for standard apps)
- **📴 Offline-first**: Queue observations and sync when online
- **🗜️ Smart compression**: Client-side WebP conversion (70-90% size reduction)
- **📱 Mobile-ready**: Native iOS/Android apps via Capacitor
- **🔄 Background sync**: Service Worker handles uploads automatically

## 📋 Prerequisites

- Node.js 18+
- npm or pnpm
- For mobile builds:
  - Android Studio (for Android)
  - Xcode (for iOS, macOS only)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/your-org/globe-observer-lite.git
cd globe-observer-lite/globe-lite

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📂 Project Structure

```
globe-lite/
├── public/
│   ├── sw.js              # Service Worker (offline caching)
│   ├── offline.html       # Offline fallback page
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/
│   │   ├── ObservationForm.svelte  # Main observation capture
│   │   ├── PendingUploads.svelte   # Queue management UI
│   │   ├── ImageUploader.svelte    # Image compression
│   │   └── OfflineIndicator.svelte # Network status
│   ├── lib/
│   │   ├── offline-storage.ts      # IndexedDB wrapper
│   │   ├── sync-worker.ts          # Upload sync logic
│   │   └── globe-api.ts            # GLOBE API client
│   ├── layouts/
│   │   └── Layout.astro            # Base layout
│   └── pages/
│       ├── index.astro             # Home page
│       ├── observe.astro           # Capture observations
│       ├── pending.astro           # Pending uploads
│       ├── gallery.astro           # View observations
│       └── compare.astro           # Speed comparison demo
├── android/                        # Android native project
├── ios/                            # iOS native project
└── capacitor.config.ts             # Capacitor configuration
```

## 🧞 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run cap:sync` | Build and sync to native platforms |
| `npm run cap:android` | Build, sync, and open Android Studio |
| `npm run cap:ios` | Build, sync, and open Xcode |

## 📱 Mobile Development

### Android

```bash
# Build and open in Android Studio
npm run cap:android

# In Android Studio: Run > Run 'app'
```

### iOS (macOS only)

```bash
# Build and open in Xcode
npm run cap:ios

# In Xcode: Product > Run
```

## 🔧 How It Works

### Offline Storage Flow

1. **Capture**: User captures photo + metadata
2. **Compress**: Image compressed to WebP (< 500KB)
3. **Queue**: Observation saved to IndexedDB
4. **Sync**: Service Worker uploads when online
5. **Confirm**: User notified of sync status

### Service Worker Strategy

- **GET requests**: Cache-first for assets, network-first for API
- **POST requests**: Passed through (not intercepted)
- **Offline**: Returns cached content or offline.html fallback
- **Background Sync**: Automatically retries failed uploads

## 🌐 GLOBE API Integration

The app integrates with the [GLOBE API](https://api.globe.gov/search/swagger-ui.html) for:

- Fetching existing observations (GeoJSON format)
- Submitting new observations (requires API key)
- Protocol support: Clouds, Mosquito Habitat, Land Cover, Tree Heights, Sky Conditions

## 🎨 Tech Stack

- **[Astro](https://astro.build)**: Zero-JS-by-default framework
- **[Svelte 5](https://svelte.dev)**: Lightweight reactive components
- **[Tailwind CSS](https://tailwindcss.com)**: Utility-first styling
- **[Capacitor](https://capacitorjs.com)**: Native mobile wrapper
- **[browser-image-compression](https://github.com/nicolo-ribaudo/browser-image-compression)**: Client-side WebP compression

## 📊 Performance Comparison

| Metric | Standard App | GLOBE Lite | Improvement |
|--------|--------------|------------|-------------|
| Initial Load | 2-5 MB | < 200 KB | **10-25x** |
| Time on 3G | 5-8 sec | < 2 sec | **4x faster** |
| Offline Support | ❌ | ✅ | Full |
| Image Upload | 2-5 MB | < 500 KB | **5-10x** |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the NASA GLOBE Program. See [LICENSE](LICENSE) for details.

## 🔗 Resources

- [GLOBE Program](https://www.globe.gov)
- [GLOBE API Documentation](https://api.globe.gov/search/swagger-ui.html)
- [Astro Documentation](https://docs.astro.build)
- [Capacitor Documentation](https://capacitorjs.com/docs)
