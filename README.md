# MosquitoWatch

<div align="center">
<img src="mosquitotracker.webp" alt="MosquitoTracker">

Global mosquito surveillance platform combining NASA satellite data with GLOBE Observer citizen science observations. Built for the NASA EMERGE Hackathon.
</div>

## Live Demo

Open `index.html` in a browser or start a local server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`

## Features

### Interactive Global Map
- Real-time mosquito habitat observations from the **GLOBE Observer API**
- Disease risk zones based on NASA satellite monitoring methodology
- Toggle layers: GLOBE observations, NDVI vegetation index, precipitation, temperature, disease risk

### NASA Data Integration
- **MODIS** - Vegetation indices (NDVI) and land surface temperature (250m-1km resolution, daily)
- **GPM IMERG** - Global precipitation data (~10km resolution, 30-min updates)
- **Landsat 8/9** - Water body detection for breeding sites (30m resolution)

### Mosquito Species Tracking
| Species | Diseases | Active Time | Breeding Sites |
|---------|----------|-------------|----------------|
| **Anopheles** | Malaria | Dusk to dawn | Clean, sunlit water pools |
| **Aedes aegypti** | Dengue, Zika, Chikungunya | Daytime | Containers, tires, urban areas |
| **Culex** | West Nile, Rift Valley Fever | Nighttime | Polluted water, flooded areas |

## Project Structure

```
NasaHackathon/
├── index.html        # Main application
├── map-embed.html    # Standalone map for iframe embedding
├── globe-map.js      # GLOBE API + NASA data layer logic
├── script.js         # UI interactions
├── styles.css        # Styling
└── README.md
```

## Embedding the Map

Embed the map using an iframe:

```html
<iframe
  src="map-embed.html"
  width="100%"
  height="500"
  frameborder="0">
</iframe>
```

## Data Sources

### GLOBE Observer API (Real Data)
The map fetches real citizen science observations from:
```
https://api.globe.gov/search/v1/measurement/?protocols=mosquito_habitat_mapper
```

This returns actual mosquito habitat reports submitted by community members worldwide.

### Disease Risk Zones (Demonstration)
Risk zone overlays are based on NASA's methodology for tracking disease by satellite:
- Environmental conditions (temperature, rainfall, vegetation) predict mosquito breeding 7-14 days in advance
- Successfully predicted Rift Valley Fever outbreak in Kenya (2016)
- Based on research by NASA scientists Assaf Anyamba and Antar Jutla

## API Reference

The GLOBE Observer API provides GeoJSON data with:
- Observation coordinates
- Water source type (container, natural pool, etc.)
- Larvae count
- Observation date
- Photo documentation

## Technologies

- **Leaflet.js** - Interactive mapping
- **Leaflet.markercluster** - Marker clustering for performance
- **GLOBE Observer API** - Citizen science data
- **OpenStreetMap** - Base map tiles

## Scientific Basis

Based on NASA Earth Observatory research: [Tracking Disease by Satellite](https://science.nasa.gov/earth/earth-observatory/tracking-disease-by-satellite/)

Key methodology:
1. MODIS NDVI anomalies indicate wetter conditions = better mosquito habitat
2. GPM precipitation tracks rainfall creating breeding sites
3. Land surface temperature identifies optimal breeding ranges (15-40°C)
4. Combined analysis predicts outbreak risk 7-14 days ahead

## Team

GeoEMERGE Hackathon 2026

## License

MIT License - Open source for global health impact

## Acknowledgments

- NASA Earth Science Data Systems
- GLOBE Observer Program
- MODIS Science Team
- GPM Mission
- WHO (disease burden statistics)
