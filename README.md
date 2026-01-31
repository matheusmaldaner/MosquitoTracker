# GLOBE Observer Lite

> Low-bandwidth optimized citizen science platform for NASA's GLOBE Program

## The Problem

GLOBE Observer is unusable in developing countries with slow internet (2G/3G). We're building a 10x faster alternative.

## Our Solution

| Current GLOBE | Our Prototype |
|---------------|---------------|
| 2-5 MB initial load | <200 KB |
| 5-8 sec on 3G | <2 sec on 3G |
| No offline mode | Full PWA support |
| Image quality issues | AI enhancement |

## Quick Start

```bash
npm create astro@latest globe-observer-lite
cd globe-observer-lite
npx astro add svelte tailwind
npm run dev
```

## Stack

- **Astro** - Zero JS by default
- **Svelte** - Tiny interactive components
- **Turso** - Edge SQLite database
- **Vercel** - Global CDN deployment

## API

Using GLOBE's public API:
```
https://api.globe.gov/search/v1/measurement/protocol/measureddate/
?protocols=mosquito_habitat_mapper
&startdate=2026-01-01
&enddate=2026-01-31
&geojson=TRUE
```

## Team

GeoEMERGE Hackathon 2026

## License

MIT

