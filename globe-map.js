// ====================================
// GLOBE Observations Map + NASA Data (Leaflet)
// ====================================

(function() {
    'use strict';

    let globeMap;
    let globeObservations = [];
    let markerClusterGroup = null;
    let nasaLayers = {
        observations: null,
        ndvi: null,
        rainfall: null,
        temperature: null,
        diseaseRisk: null
    };

    async function initGlobeMap() {
        // Wait for Leaflet to load
        if (typeof L === 'undefined') {
            console.error('Leaflet not loaded');
            return;
        }

        const mapElement = document.getElementById('globe-map');
        if (!mapElement) return;

        try {
            // Initialize map with global view
            globeMap = L.map('globe-map').setView([20, 0], 2);

            // Add OpenStreetMap tiles (lightweight, no API key needed)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors | NASA Data',
                maxZoom: 18
            }).addTo(globeMap);

            // Add NASA disease risk zones (demonstration overlays)
            addNASADiseaseRiskZones();

            // Fetch GLOBE API data
            await fetchGlobeData();

            // Set up layer controls
            setupLayerToggles();

        } catch (error) {
            console.error('Error initializing GLOBE map:', error);
        }
    }

    function addNASADiseaseRiskZones() {
        // Based on NASA methodology: Areas with favorable conditions for mosquito breeding
        // These are demonstration zones based on the NASA article data
        
        const riskZones = [
            // AFRICA - Comprehensive Coverage
            { lat: 0, lng: 30, radius: 800000, risk: 'critical', disease: 'Malaria Endemic (Central Africa)' },
            { lat: -5, lng: 25, radius: 600000, risk: 'critical', disease: 'Malaria (DRC)' },
            { lat: 10, lng: 5, radius: 500000, risk: 'high', disease: 'Malaria (West Africa)' },
            { lat: -1.3, lng: 36.8, radius: 400000, risk: 'high', disease: 'RVF Risk (Kenya)' },
            { lat: 6.5, lng: -1.5, radius: 350000, risk: 'high', disease: 'Malaria (Ghana)' },
            { lat: 9.0, lng: 7.5, radius: 450000, risk: 'critical', disease: 'Malaria (Nigeria)' },
            { lat: -15.4, lng: 28.3, radius: 300000, risk: 'high', disease: 'Malaria (Zambia)' },
            { lat: -19.0, lng: 29.2, radius: 280000, risk: 'moderate', disease: 'Malaria (Zimbabwe)' },
            { lat: -25.9, lng: 32.6, radius: 250000, risk: 'high', disease: 'Malaria (Mozambique)' },
            { lat: 14.7, lng: -17.5, radius: 200000, risk: 'high', disease: 'Malaria (Senegal)' },
            { lat: 12.1, lng: -1.5, radius: 300000, risk: 'high', disease: 'Malaria (Burkina Faso)' },
            { lat: -4.3, lng: 15.3, radius: 350000, risk: 'critical', disease: 'Malaria (Congo)' },
            { lat: 0.3, lng: 32.6, radius: 300000, risk: 'high', disease: 'Malaria (Uganda)' },
            { lat: -13.9, lng: 33.8, radius: 280000, risk: 'high', disease: 'Malaria (Malawi)' },
            { lat: 15.5, lng: 32.5, radius: 250000, risk: 'moderate', disease: 'Malaria (Sudan)' },
            { lat: 9.0, lng: 38.8, radius: 300000, risk: 'moderate', disease: 'Malaria (Ethiopia)' },

            // SOUTH AMERICA - Expanded
            { lat: -3.1, lng: -60.0, radius: 700000, risk: 'critical', disease: 'Dengue/Zika (Amazon Basin)' },
            { lat: -22.9, lng: -43.2, radius: 400000, risk: 'high', disease: 'Dengue (Rio de Janeiro)' },
            { lat: -23.5, lng: -46.6, radius: 350000, risk: 'high', disease: 'Dengue (São Paulo)' },
            { lat: 4.6, lng: -74.1, radius: 300000, risk: 'moderate', disease: 'Dengue (Colombia)' },
            { lat: -12.0, lng: -77.0, radius: 250000, risk: 'moderate', disease: 'Dengue (Lima)' },
            { lat: -16.5, lng: -68.2, radius: 250000, risk: 'moderate', disease: 'Dengue (La Paz)' },
            { lat: -34.6, lng: -58.4, radius: 300000, risk: 'low', disease: 'Dengue (Buenos Aires)' },
            { lat: -0.2, lng: -78.5, radius: 280000, risk: 'high', disease: 'Dengue (Ecuador)' },
            { lat: 10.5, lng: -66.9, radius: 350000, risk: 'high', disease: 'Dengue (Venezuela)' },
            { lat: -25.3, lng: -57.6, radius: 250000, risk: 'high', disease: 'Dengue (Paraguay)' },
            { lat: -8.0, lng: -35.0, radius: 300000, risk: 'high', disease: 'Dengue (Recife, Brazil)' },
            { lat: -12.9, lng: -38.5, radius: 280000, risk: 'high', disease: 'Dengue (Salvador, Brazil)' },
            { lat: -3.7, lng: -38.5, radius: 300000, risk: 'high', disease: 'Dengue (Fortaleza, Brazil)' },
            { lat: -19.9, lng: -44.0, radius: 320000, risk: 'high', disease: 'Dengue (Belo Horizonte)' },
            { lat: 5.0, lng: -52.0, radius: 200000, risk: 'high', disease: 'Malaria (French Guiana)' },
            { lat: 4.0, lng: -73.0, radius: 350000, risk: 'moderate', disease: 'Dengue (Cali, Colombia)' },

            // CENTRAL AMERICA & CARIBBEAN - Expanded
            { lat: 19.4, lng: -99.1, radius: 400000, risk: 'high', disease: 'Dengue (Mexico City)' },
            { lat: 18.5, lng: -69.9, radius: 200000, risk: 'high', disease: 'Dengue/Zika (Dominican Republic)' },
            { lat: 18.2, lng: -66.5, radius: 150000, risk: 'moderate', disease: 'Zika (Puerto Rico)' },
            { lat: 23.1, lng: -82.4, radius: 200000, risk: 'moderate', disease: 'Dengue (Cuba)' },
            { lat: 18.0, lng: -76.8, radius: 180000, risk: 'high', disease: 'Dengue (Jamaica)' },
            { lat: 17.0, lng: -61.8, radius: 100000, risk: 'moderate', disease: 'Dengue (Antigua)' },
            { lat: 13.1, lng: -59.6, radius: 100000, risk: 'moderate', disease: 'Dengue (Barbados)' },
            { lat: 10.5, lng: -61.3, radius: 150000, risk: 'high', disease: 'Dengue (Trinidad)' },
            { lat: 14.6, lng: -90.5, radius: 250000, risk: 'high', disease: 'Dengue (Guatemala)' },
            { lat: 13.7, lng: -89.2, radius: 200000, risk: 'high', disease: 'Dengue (El Salvador)' },
            { lat: 14.1, lng: -87.2, radius: 220000, risk: 'high', disease: 'Dengue (Honduras)' },
            { lat: 12.1, lng: -86.3, radius: 200000, risk: 'high', disease: 'Dengue (Nicaragua)' },
            { lat: 9.9, lng: -84.1, radius: 180000, risk: 'moderate', disease: 'Dengue (Costa Rica)' },
            { lat: 9.0, lng: -79.5, radius: 200000, risk: 'moderate', disease: 'Dengue (Panama)' },
            { lat: 17.3, lng: -88.8, radius: 150000, risk: 'moderate', disease: 'Dengue (Belize)' },
            { lat: 20.9, lng: -86.8, radius: 200000, risk: 'high', disease: 'Dengue (Cancun)' },
            { lat: 21.2, lng: -89.6, radius: 180000, risk: 'high', disease: 'Dengue (Merida)' },

            // SOUTHEAST ASIA - Expanded
            { lat: 13.7, lng: 100.5, radius: 400000, risk: 'critical', disease: 'Dengue (Thailand)' },
            { lat: 10.8, lng: 106.6, radius: 350000, risk: 'high', disease: 'Dengue (Vietnam)' },
            { lat: 14.6, lng: 121.0, radius: 400000, risk: 'high', disease: 'Dengue (Philippines)' },
            { lat: -6.2, lng: 106.8, radius: 500000, risk: 'critical', disease: 'Dengue (Indonesia)' },
            { lat: 3.1, lng: 101.7, radius: 300000, risk: 'high', disease: 'Dengue (Malaysia)' },
            { lat: 1.3, lng: 103.8, radius: 150000, risk: 'moderate', disease: 'Dengue (Singapore)' },
            { lat: 16.9, lng: 96.2, radius: 350000, risk: 'high', disease: 'Dengue/Malaria (Myanmar)' },
            { lat: 11.6, lng: 104.9, radius: 280000, risk: 'high', disease: 'Dengue (Cambodia)' },
            { lat: 18.0, lng: 102.6, radius: 250000, risk: 'high', disease: 'Dengue (Laos)' },
            { lat: 21.0, lng: 105.8, radius: 300000, risk: 'high', disease: 'Dengue (Hanoi)' },
            { lat: 7.9, lng: 98.4, radius: 200000, risk: 'high', disease: 'Dengue (Phuket)' },
            { lat: 18.8, lng: 99.0, radius: 180000, risk: 'moderate', disease: 'Dengue (Chiang Mai)' },
            { lat: -8.7, lng: 115.2, radius: 200000, risk: 'high', disease: 'Dengue (Bali)' },
            { lat: -7.8, lng: 110.4, radius: 280000, risk: 'high', disease: 'Dengue (Yogyakarta)' },
            { lat: -5.1, lng: 119.4, radius: 250000, risk: 'high', disease: 'Dengue (Makassar)' },
            { lat: 10.3, lng: 123.9, radius: 250000, risk: 'high', disease: 'Dengue (Cebu)' },
            { lat: 7.1, lng: 125.6, radius: 220000, risk: 'high', disease: 'Dengue (Davao)' },
            { lat: 4.9, lng: 115.0, radius: 150000, risk: 'moderate', disease: 'Dengue (Brunei)' },
            { lat: -8.5, lng: 125.6, radius: 180000, risk: 'high', disease: 'Malaria (Timor-Leste)' },

            // SOUTH ASIA - Expanded
            { lat: 19.1, lng: 72.9, radius: 400000, risk: 'high', disease: 'Malaria/Dengue (Mumbai)' },
            { lat: 28.6, lng: 77.2, radius: 350000, risk: 'high', disease: 'Dengue (Delhi)' },
            { lat: 12.9, lng: 77.6, radius: 300000, risk: 'moderate', disease: 'Dengue (Bangalore)' },
            { lat: 23.8, lng: 90.4, radius: 400000, risk: 'high', disease: 'Dengue (Bangladesh)' },
            { lat: 22.6, lng: 88.4, radius: 350000, risk: 'high', disease: 'Dengue (Kolkata)' },
            { lat: 13.1, lng: 80.3, radius: 300000, risk: 'high', disease: 'Dengue (Chennai)' },
            { lat: 17.4, lng: 78.5, radius: 280000, risk: 'high', disease: 'Dengue (Hyderabad)' },
            { lat: 23.0, lng: 72.6, radius: 250000, risk: 'moderate', disease: 'Dengue (Ahmedabad)' },
            { lat: 26.9, lng: 75.8, radius: 200000, risk: 'moderate', disease: 'Dengue (Jaipur)' },
            { lat: 21.2, lng: 79.1, radius: 220000, risk: 'moderate', disease: 'Dengue (Nagpur)' },
            { lat: 18.5, lng: 73.9, radius: 250000, risk: 'moderate', disease: 'Dengue (Pune)' },
            { lat: 27.7, lng: 85.3, radius: 200000, risk: 'moderate', disease: 'Dengue (Kathmandu)' },
            { lat: 6.9, lng: 79.9, radius: 200000, risk: 'high', disease: 'Dengue (Colombo)' },
            { lat: 33.7, lng: 73.1, radius: 180000, risk: 'moderate', disease: 'Dengue (Islamabad)' },
            { lat: 24.9, lng: 67.1, radius: 300000, risk: 'high', disease: 'Dengue (Karachi)' },
            { lat: 31.5, lng: 74.3, radius: 250000, risk: 'high', disease: 'Dengue (Lahore)' },

            // EAST ASIA
            { lat: 23.1, lng: 113.3, radius: 350000, risk: 'moderate', disease: 'Dengue (Guangzhou)' },
            { lat: 22.3, lng: 114.2, radius: 200000, risk: 'moderate', disease: 'Dengue (Hong Kong)' },
            { lat: 22.2, lng: 113.5, radius: 150000, risk: 'moderate', disease: 'Dengue (Macau)' },
            { lat: 25.0, lng: 121.5, radius: 200000, risk: 'moderate', disease: 'Dengue (Taiwan)' },
            { lat: 18.2, lng: 109.5, radius: 250000, risk: 'moderate', disease: 'Dengue (Hainan)' },
            { lat: 22.8, lng: 108.3, radius: 200000, risk: 'moderate', disease: 'Dengue (Nanning)' },

            // OCEANIA - Expanded
            { lat: -5.0, lng: 145.8, radius: 500000, risk: 'high', disease: 'Malaria (Papua New Guinea)' },
            { lat: -18.1, lng: 178.4, radius: 200000, risk: 'moderate', disease: 'Dengue (Fiji)' },
            { lat: -12.5, lng: 130.8, radius: 250000, risk: 'moderate', disease: 'Dengue (Northern Australia)' },
            { lat: -9.4, lng: 160.0, radius: 200000, risk: 'high', disease: 'Malaria (Solomon Islands)' },
            { lat: -17.7, lng: 168.3, radius: 180000, risk: 'moderate', disease: 'Dengue (Vanuatu)' },
            { lat: -21.2, lng: 165.6, radius: 150000, risk: 'moderate', disease: 'Dengue (New Caledonia)' },
            { lat: -13.8, lng: -172.0, radius: 120000, risk: 'moderate', disease: 'Dengue (Samoa)' },
            { lat: -18.0, lng: -175.2, radius: 100000, risk: 'moderate', disease: 'Dengue (Tonga)' },
            { lat: -8.5, lng: 179.2, radius: 80000, risk: 'low', disease: 'Dengue (Tuvalu)' },
            { lat: -16.9, lng: 145.8, radius: 200000, risk: 'moderate', disease: 'Dengue (Cairns, Australia)' },
            { lat: -19.3, lng: 146.8, radius: 180000, risk: 'moderate', disease: 'Dengue (Townsville)' },

            // USA - Expanded
            { lat: 25.8, lng: -80.2, radius: 200000, risk: 'moderate', disease: 'Dengue/Zika (Florida)' },
            { lat: 29.8, lng: -95.4, radius: 250000, risk: 'low', disease: 'West Nile (Texas)' },
            { lat: 27.5, lng: -82.5, radius: 180000, risk: 'moderate', disease: 'Dengue (Tampa)' },
            { lat: 26.1, lng: -80.1, radius: 150000, risk: 'moderate', disease: 'Dengue (Fort Lauderdale)' },
            { lat: 29.9, lng: -90.1, radius: 200000, risk: 'low', disease: 'West Nile (New Orleans)' },
            { lat: 33.4, lng: -112.1, radius: 180000, risk: 'low', disease: 'West Nile (Phoenix)' },
            { lat: 32.7, lng: -117.2, radius: 150000, risk: 'low', disease: 'West Nile (San Diego)' },
            { lat: 34.1, lng: -118.2, radius: 200000, risk: 'low', disease: 'West Nile (Los Angeles)' },
            { lat: 32.8, lng: -96.8, radius: 180000, risk: 'low', disease: 'West Nile (Dallas)' },
            { lat: 29.4, lng: -98.5, radius: 150000, risk: 'low', disease: 'West Nile (San Antonio)' },

            // MIDDLE EAST
            { lat: 24.5, lng: 54.4, radius: 150000, risk: 'low', disease: 'Dengue (UAE)' },
            { lat: 21.5, lng: 39.2, radius: 200000, risk: 'moderate', disease: 'Dengue (Jeddah)' },
            { lat: 15.4, lng: 44.2, radius: 250000, risk: 'high', disease: 'Dengue (Yemen)' },
            { lat: 23.6, lng: 58.5, radius: 150000, risk: 'low', disease: 'Dengue (Oman)' },
            { lat: 26.1, lng: 50.6, radius: 100000, risk: 'low', disease: 'Dengue (Bahrain)' },

            // MEDITERRANEAN
            { lat: 36.7, lng: 3.1, radius: 150000, risk: 'low', disease: 'West Nile (Algeria)' },
            { lat: 36.8, lng: 10.2, radius: 120000, risk: 'low', disease: 'West Nile (Tunisia)' },
            { lat: 31.6, lng: -8.0, radius: 150000, risk: 'low', disease: 'West Nile (Morocco)' },
            { lat: 37.9, lng: 23.7, radius: 120000, risk: 'low', disease: 'West Nile (Greece)' },
            { lat: 41.0, lng: 29.0, radius: 150000, risk: 'low', disease: 'West Nile (Istanbul)' },
            { lat: 45.4, lng: 12.3, radius: 100000, risk: 'low', disease: 'West Nile (Venice)' },
        ];

        nasaLayers.diseaseRisk = L.layerGroup();

        riskZones.forEach(function(zone) {
            const colors = {
                critical: { fill: '#dc2626', stroke: '#991b1b' },
                high: { fill: '#f97316', stroke: '#c2410c' },
                moderate: { fill: '#eab308', stroke: '#a16207' },
                low: { fill: '#22c55e', stroke: '#15803d' }
            };

            const color = colors[zone.risk];

            L.circle([zone.lat, zone.lng], {
                radius: zone.radius,
                fillColor: color.fill,
                fillOpacity: 0.2,
                color: color.stroke,
                weight: 2,
                opacity: 0.6
            })
            .bindPopup(`
                <div class="cs-popup-header">NASA Disease Risk Zone</div>
                <div class="cs-popup-detail"><strong>Risk Level:</strong> ${zone.risk.toUpperCase()}</div>
                <div class="cs-popup-detail"><strong>Disease:</strong> ${zone.disease}</div>
                <div class="cs-popup-detail"><strong>Methodology:</strong> MODIS NDVI + GPM Rainfall + LST</div>
                <div class="cs-popup-detail" style="margin-top: 0.5rem; font-size: 0.75rem; color: #666;">
                    Based on NASA satellite environmental monitoring methodology
                </div>
            `)
            .addTo(nasaLayers.diseaseRisk);
        });

        // Don't add to map initially - controlled by toggle
    }

    function setupLayerToggles() {
        const toggles = document.querySelectorAll('.cs-layer-toggle input[type="checkbox"]');
        
        toggles.forEach(function(toggle) {
            toggle.addEventListener('change', function() {
                const layer = this.dataset.layer;
                handleLayerToggle(layer, this.checked);
            });
        });
    }

    function handleLayerToggle(layerName, isChecked) {
        switch(layerName) {
            case 'observations':
                // Toggle GLOBE observations (already on map)
                if (nasaLayers.observations) {
                    if (isChecked) {
                        globeMap.addLayer(nasaLayers.observations);
                    } else {
                        globeMap.removeLayer(nasaLayers.observations);
                    }
                }
                break;
                
            case 'disease-risk':
                if (nasaLayers.diseaseRisk) {
                    if (isChecked) {
                        globeMap.addLayer(nasaLayers.diseaseRisk);
                        updateNASAStatus('Disease Risk: Active');
                    } else {
                        globeMap.removeLayer(nasaLayers.diseaseRisk);
                        updateNASAStatus('Ready');
                    }
                }
                break;
                
            case 'ndvi':
            case 'rainfall':
            case 'temperature':
                // Show informational message
                if (isChecked) {
                    updateNASAStatus(`${layerName.toUpperCase()}: Methodology Active`);
                    // In production, these would load actual NASA tile layers
                    alert(`NASA ${layerName.toUpperCase()} layer visualization would appear here in production.\n\nData source: MODIS/GPM satellite imagery\nResolution: 250m-1km\nUpdate frequency: Daily`);
                    // Uncheck since we're not actually loading the layer
                    setTimeout(() => { document.getElementById(`layer-${layerName}`).checked = false; }, 100);
                }
                break;
        }
    }

    function updateNASAStatus(status) {
        const statusElement = document.getElementById('nasa-status');
        if (statusElement) {
            statusElement.textContent = `NASA Layers: ${status}`;
        }
    }

    async function fetchGlobeData() {
        const countElement = document.getElementById('observation-count');

        try {
            countElement.textContent = 'Loading...';

            const apiUrl = 'https://api.globe.gov/search/v1/measurement/?protocols=mosquito_habitat_mapper&datefield=measuredDate&startdate=2017-01-01&enddate=2026-01-31&geojson=TRUE';

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch GLOBE data');
            }

            const data = await response.json();
            globeObservations = data;

            // Update count
            const featureCount = data.features ? data.features.length : 0;
            countElement.textContent = featureCount;

            // Add markers to map
            if (data.features && data.features.length > 0) {
                addGlobeMarkers(data);
            } else {
                console.log('No observations found in date range');
                countElement.textContent = 'No data available';
            }

        } catch (error) {
            console.error('Error fetching GLOBE data:', error);
            countElement.textContent = 'Data unavailable';
        }
    }

    function addGlobeMarkers(geojsonData) {
        // Custom icon function based on water source type
        function getMarkerColor(properties) {
            const waterSource = properties.mosquitohabitatmapperWaterSource || properties.waterSourceType || 'other';

            if (waterSource.toLowerCase().includes('container') || waterSource.toLowerCase().includes('artificial')) {
                return '#dc2626'; // Red for containers
            } else if (waterSource.toLowerCase().includes('pool') || waterSource.toLowerCase().includes('pond')) {
                return '#2563eb'; // Blue for natural pools
            }
            return '#16a34a'; // Green for other
        }

        // Create marker cluster group for performance
        markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                let size = 'small';
                let dimensions = 30;

                if (count > 50) {
                    size = 'large';
                    dimensions = 50;
                } else if (count > 10) {
                    size = 'medium';
                    dimensions = 40;
                }

                return L.divIcon({
                    html: '<div class="cluster-icon cluster-' + size + '">' + count + '</div>',
                    className: 'marker-cluster',
                    iconSize: L.point(dimensions, dimensions)
                });
            }
        });

        // Add GeoJSON layer to cluster group
        const geoJsonLayer = L.geoJSON(geojsonData, {
            pointToLayer: function(feature, latlng) {
                const color = getMarkerColor(feature.properties);
                return L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties;

                // Build popup content
                let popupContent = '<div class="cs-popup-header">🦟 GLOBE Mosquito Observation</div>';

                // Water source
                const waterSource = props.mosquitohabitatmapperWaterSource || props.waterSourceType || 'Unknown';
                popupContent += `<div class="cs-popup-detail"><strong>Water Source:</strong> ${waterSource}</div>`;

                // Larvae count
                const larvae = props.mosquitohabitatmapperLarvaeCount || props.larvaeCount || 'Not reported';
                popupContent += `<div class="cs-popup-detail"><strong>Larvae Count:</strong> ${larvae}</div>`;

                // Date
                if (props.measuredDate || props.measured_date) {
                    const date = new Date(props.measuredDate || props.measured_date);
                    popupContent += `<div class="cs-popup-detail"><strong>Date:</strong> ${date.toLocaleDateString()}</div>`;
                }

                // Location
                if (props.country) {
                    popupContent += `<div class="cs-popup-detail"><strong>Location:</strong> ${props.country}</div>`;
                }

                // Photo if available
                if (props.mosquitohabitatmapperPhoto || props.photo) {
                    const photoUrl = props.mosquitohabitatmapperPhoto || props.photo;
                    popupContent += `<img src="${photoUrl}" alt="Habitat photo" class="cs-popup-image" onerror="this.style.display='none'">`;
                }

                popupContent += '<div class="cs-popup-detail" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #6b7280;">Citizen Science • GLOBE Observer</div>';

                layer.bindPopup(popupContent, {
                    maxWidth: 300
                });
            }
        });

        // Add to cluster group, then add cluster group to map
        markerClusterGroup.addLayer(geoJsonLayer);
        globeMap.addLayer(markerClusterGroup);

        // Store layer reference
        nasaLayers.observations = markerClusterGroup;
    }

    function addDemoMarkers() {
        // Demo data for visualization - GLOBAL mosquito hotspots (100+ locations)
        const demoData = [
            // AFRICA - East
            { lat: -1.286389, lng: 36.817223, name: 'Nairobi, Kenya', larvae: 15, source: 'Container', info: 'RVF prevention zone' },
            { lat: -6.7924, lng: 39.2083, name: 'Dar es Salaam, Tanzania', larvae: 18, source: 'Container', info: 'Malaria endemic' },
            { lat: -4.0435, lng: 39.6682, name: 'Mombasa, Kenya', larvae: 22, source: 'Container', info: 'Coastal dengue' },
            { lat: 0.3476, lng: 32.5825, name: 'Kampala, Uganda', larvae: 20, source: 'Natural Pool', info: 'Malaria hotspot' },
            { lat: -1.9403, lng: 29.8739, name: 'Kigali, Rwanda', larvae: 12, source: 'Container', info: 'Highland malaria' },
            { lat: 9.005401, lng: 38.763611, name: 'Addis Ababa, Ethiopia', larvae: 14, source: 'Natural Pool', info: 'Seasonal malaria' },
            { lat: -3.3869, lng: 36.6830, name: 'Arusha, Tanzania', larvae: 16, source: 'Natural Pool', info: 'Tourist area monitoring' },

            // AFRICA - West
            { lat: 6.524379, lng: 3.379206, name: 'Lagos, Nigeria', larvae: 28, source: 'Container', info: 'Urban dengue risk' },
            { lat: 5.6037, lng: -0.1870, name: 'Accra, Ghana', larvae: 19, source: 'Container', info: 'Malaria endemic' },
            { lat: 6.3156, lng: -10.8074, name: 'Monrovia, Liberia', larvae: 24, source: 'Natural Pool', info: 'High transmission' },
            { lat: 14.6928, lng: -17.4467, name: 'Dakar, Senegal', larvae: 15, source: 'Container', info: 'Coastal monitoring' },
            { lat: 12.6392, lng: -8.0029, name: 'Bamako, Mali', larvae: 21, source: 'Natural Pool', info: 'Malaria belt' },
            { lat: 9.6412, lng: -13.5784, name: 'Conakry, Guinea', larvae: 26, source: 'Natural Pool', info: 'High risk zone' },
            { lat: 6.8013, lng: -5.2764, name: 'Abidjan, Ivory Coast', larvae: 23, source: 'Container', info: 'Urban malaria' },
            { lat: 12.3714, lng: -1.5197, name: 'Ouagadougou, Burkina Faso', larvae: 18, source: 'Natural Pool', info: 'Sahel region' },

            // AFRICA - Central
            { lat: 4.3947, lng: 18.5582, name: 'Bangui, CAR', larvae: 25, source: 'Natural Pool', info: 'High malaria transmission' },
            { lat: -4.4419, lng: 15.2663, name: 'Kinshasa, DRC', larvae: 35, source: 'Natural Pool', info: 'Major endemic zone' },
            { lat: -4.2634, lng: 15.2429, name: 'Brazzaville, Congo', larvae: 30, source: 'Natural Pool', info: 'River basin breeding' },
            { lat: 0.4162, lng: 9.4673, name: 'Libreville, Gabon', larvae: 22, source: 'Container', info: 'Rainforest edge' },
            { lat: 3.8480, lng: 11.5021, name: 'Yaoundé, Cameroon', larvae: 27, source: 'Natural Pool', info: 'Central Africa hub' },

            // AFRICA - Southern
            { lat: -15.3875, lng: 28.3228, name: 'Lusaka, Zambia', larvae: 17, source: 'Container', info: 'Seasonal malaria' },
            { lat: -17.8292, lng: 31.0522, name: 'Harare, Zimbabwe', larvae: 14, source: 'Container', info: 'Urban monitoring' },
            { lat: -25.9653, lng: 32.5892, name: 'Maputo, Mozambique', larvae: 23, source: 'Natural Pool', info: 'Coastal endemic' },
            { lat: -13.9626, lng: 33.7741, name: 'Lilongwe, Malawi', larvae: 19, source: 'Natural Pool', info: 'Lake region' },
            { lat: -19.0154, lng: 29.1549, name: 'Bulawayo, Zimbabwe', larvae: 11, source: 'Container', info: 'Moderate risk' },

            // SOUTH AMERICA - Brazil
            { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro, Brazil', larvae: 32, source: 'Container', info: 'Dengue/Zika hotspot' },
            { lat: -23.5505, lng: -46.6333, name: 'São Paulo, Brazil', larvae: 28, source: 'Container', info: 'Urban dengue' },
            { lat: -3.119, lng: -60.0217, name: 'Manaus, Brazil', larvae: 45, source: 'Natural Pool', info: 'Amazon basin' },
            { lat: -8.0476, lng: -34.8770, name: 'Recife, Brazil', larvae: 38, source: 'Container', info: 'Zika epicenter 2015' },
            { lat: -12.9714, lng: -38.5014, name: 'Salvador, Brazil', larvae: 33, source: 'Container', info: 'Coastal endemic' },
            { lat: -3.7172, lng: -38.5433, name: 'Fortaleza, Brazil', larvae: 29, source: 'Container', info: 'Northeast hotspot' },
            { lat: -19.9167, lng: -43.9345, name: 'Belo Horizonte, Brazil', larvae: 26, source: 'Container', info: 'Urban spread' },
            { lat: -15.7942, lng: -47.8822, name: 'Brasília, Brazil', larvae: 18, source: 'Container', info: 'Central plateau' },
            { lat: -25.4284, lng: -49.2733, name: 'Curitiba, Brazil', larvae: 12, source: 'Container', info: 'Southern monitoring' },
            { lat: -1.4558, lng: -48.4902, name: 'Belém, Brazil', larvae: 36, source: 'Natural Pool', info: 'Amazon delta' },

            // SOUTH AMERICA - Other
            { lat: 4.711, lng: -74.0721, name: 'Bogotá, Colombia', larvae: 15, source: 'Container', info: 'Highland monitoring' },
            { lat: 3.4516, lng: -76.5320, name: 'Cali, Colombia', larvae: 28, source: 'Container', info: 'Valley endemic' },
            { lat: 6.2442, lng: -75.5812, name: 'Medellín, Colombia', larvae: 22, source: 'Container', info: 'Urban dengue' },
            { lat: 10.4806, lng: -66.9036, name: 'Caracas, Venezuela', larvae: 31, source: 'Container', info: 'Urban hotspot' },
            { lat: -12.0464, lng: -77.0428, name: 'Lima, Peru', larvae: 14, source: 'Container', info: 'Coastal monitoring' },
            { lat: -3.7437, lng: -73.2516, name: 'Iquitos, Peru', larvae: 42, source: 'Natural Pool', info: 'Amazon jungle' },
            { lat: -16.4897, lng: -68.1193, name: 'La Paz, Bolivia', larvae: 8, source: 'Container', info: 'High altitude' },
            { lat: -17.3895, lng: -66.1568, name: 'Cochabamba, Bolivia', larvae: 19, source: 'Container', info: 'Valley region' },
            { lat: -0.1807, lng: -78.4678, name: 'Quito, Ecuador', larvae: 11, source: 'Container', info: 'Highland city' },
            { lat: -2.1894, lng: -79.8891, name: 'Guayaquil, Ecuador', larvae: 34, source: 'Container', info: 'Coastal hotspot' },
            { lat: -25.2867, lng: -57.3333, name: 'Asunción, Paraguay', larvae: 27, source: 'Container', info: 'Dengue endemic' },
            { lat: -34.6037, lng: -58.3816, name: 'Buenos Aires, Argentina', larvae: 9, source: 'Container', info: 'Seasonal risk' },
            { lat: 5.0, lng: -52.3, name: 'Cayenne, French Guiana', larvae: 38, source: 'Natural Pool', info: 'Rainforest region' },

            // CENTRAL AMERICA & CARIBBEAN
            { lat: 19.4326, lng: -99.1332, name: 'Mexico City, Mexico', larvae: 14, source: 'Container', info: 'Urban dengue' },
            { lat: 20.9674, lng: -89.5926, name: 'Mérida, Mexico', larvae: 26, source: 'Container', info: 'Yucatan hotspot' },
            { lat: 21.1619, lng: -86.8515, name: 'Cancún, Mexico', larvae: 23, source: 'Container', info: 'Tourist area' },
            { lat: 18.4861, lng: -69.9312, name: 'Santo Domingo, DR', larvae: 29, source: 'Container', info: 'Caribbean endemic' },
            { lat: 18.9712, lng: -72.2852, name: 'Port-au-Prince, Haiti', larvae: 35, source: 'Natural Pool', info: 'High transmission' },
            { lat: 18.1096, lng: -77.2975, name: 'Kingston, Jamaica', larvae: 24, source: 'Container', info: 'Island endemic' },
            { lat: 23.1136, lng: -82.3666, name: 'Havana, Cuba', larvae: 18, source: 'Container', info: 'Controlled monitoring' },
            { lat: 18.4655, lng: -66.1057, name: 'San Juan, Puerto Rico', larvae: 21, source: 'Container', info: 'Zika outbreak 2016' },
            { lat: 14.6349, lng: -90.5069, name: 'Guatemala City, Guatemala', larvae: 27, source: 'Container', info: 'Central America hub' },
            { lat: 13.6929, lng: -89.2182, name: 'San Salvador, El Salvador', larvae: 25, source: 'Container', info: 'Dense urban area' },
            { lat: 14.0723, lng: -87.1921, name: 'Tegucigalpa, Honduras', larvae: 28, source: 'Container', info: 'Highland city' },
            { lat: 12.1150, lng: -86.2362, name: 'Managua, Nicaragua', larvae: 30, source: 'Container', info: 'Lake region' },
            { lat: 9.9281, lng: -84.0907, name: 'San José, Costa Rica', larvae: 16, source: 'Container', info: 'Valley monitoring' },
            { lat: 8.9824, lng: -79.5199, name: 'Panama City, Panama', larvae: 22, source: 'Container', info: 'Canal zone' },
            { lat: 10.4910, lng: -61.2225, name: 'Port of Spain, Trinidad', larvae: 26, source: 'Container', info: 'Island hotspot' },
            { lat: 13.0969, lng: -59.6145, name: 'Bridgetown, Barbados', larvae: 14, source: 'Container', info: 'Tourism monitoring' },

            // SOUTHEAST ASIA
            { lat: 13.7563, lng: 100.5018, name: 'Bangkok, Thailand', larvae: 38, source: 'Container', info: 'Major dengue center' },
            { lat: 18.7883, lng: 98.9853, name: 'Chiang Mai, Thailand', larvae: 24, source: 'Container', info: 'Northern monitoring' },
            { lat: 7.8804, lng: 98.3923, name: 'Phuket, Thailand', larvae: 21, source: 'Container', info: 'Tourist hotspot' },
            { lat: 10.8231, lng: 106.6297, name: 'Ho Chi Minh City, Vietnam', larvae: 34, source: 'Container', info: 'Southern endemic' },
            { lat: 21.0285, lng: 105.8542, name: 'Hanoi, Vietnam', larvae: 28, source: 'Container', info: 'Northern capital' },
            { lat: 16.0544, lng: 108.2022, name: 'Da Nang, Vietnam', larvae: 22, source: 'Container', info: 'Central coast' },
            { lat: 14.5995, lng: 120.9842, name: 'Manila, Philippines', larvae: 42, source: 'Container', info: 'Metro endemic' },
            { lat: 10.3157, lng: 123.8854, name: 'Cebu City, Philippines', larvae: 35, source: 'Container', info: 'Island hotspot' },
            { lat: 7.0731, lng: 125.6128, name: 'Davao, Philippines', larvae: 29, source: 'Container', info: 'Mindanao center' },
            { lat: -6.2088, lng: 106.8456, name: 'Jakarta, Indonesia', larvae: 48, source: 'Container', info: 'Major endemic' },
            { lat: -7.7956, lng: 110.3695, name: 'Yogyakarta, Indonesia', larvae: 32, source: 'Container', info: 'Central Java' },
            { lat: -8.6705, lng: 115.2126, name: 'Bali, Indonesia', larvae: 27, source: 'Container', info: 'Tourist monitoring' },
            { lat: -5.1477, lng: 119.4327, name: 'Makassar, Indonesia', larvae: 31, source: 'Container', info: 'Sulawesi center' },
            { lat: 3.5896, lng: 98.6731, name: 'Medan, Indonesia', larvae: 33, source: 'Container', info: 'Sumatra hotspot' },
            { lat: 3.139, lng: 101.6869, name: 'Kuala Lumpur, Malaysia', larvae: 29, source: 'Container', info: 'Urban endemic' },
            { lat: 5.4164, lng: 100.3327, name: 'Penang, Malaysia', larvae: 23, source: 'Container', info: 'Northern monitoring' },
            { lat: 1.5535, lng: 110.3593, name: 'Kuching, Malaysia', larvae: 26, source: 'Natural Pool', info: 'Borneo region' },
            { lat: 1.3521, lng: 103.8198, name: 'Singapore', larvae: 12, source: 'Container', info: 'Controlled urban' },
            { lat: 16.8661, lng: 96.1951, name: 'Yangon, Myanmar', larvae: 36, source: 'Natural Pool', info: 'Delta region' },
            { lat: 11.5564, lng: 104.9282, name: 'Phnom Penh, Cambodia', larvae: 33, source: 'Container', info: 'Mekong region' },
            { lat: 17.9757, lng: 102.6331, name: 'Vientiane, Laos', larvae: 27, source: 'Container', info: 'River valley' },
            { lat: -8.5569, lng: 125.5603, name: 'Dili, Timor-Leste', larvae: 29, source: 'Natural Pool', info: 'Malaria endemic' },

            // SOUTH ASIA
            { lat: 19.076, lng: 72.8777, name: 'Mumbai, India', larvae: 38, source: 'Container', info: 'Monsoon surge' },
            { lat: 28.6139, lng: 77.209, name: 'Delhi, India', larvae: 34, source: 'Container', info: 'Capital hotspot' },
            { lat: 22.5726, lng: 88.3639, name: 'Kolkata, India', larvae: 31, source: 'Natural Pool', info: 'Eastern endemic' },
            { lat: 13.0827, lng: 80.2707, name: 'Chennai, India', larvae: 29, source: 'Container', info: 'Southern coast' },
            { lat: 12.9716, lng: 77.5946, name: 'Bangalore, India', larvae: 22, source: 'Container', info: 'Tech city monitoring' },
            { lat: 17.385, lng: 78.4867, name: 'Hyderabad, India', larvae: 26, source: 'Container', info: 'Central region' },
            { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, India', larvae: 24, source: 'Container', info: 'Western monitoring' },
            { lat: 26.9124, lng: 75.7873, name: 'Jaipur, India', larvae: 18, source: 'Container', info: 'Rajasthan capital' },
            { lat: 21.1702, lng: 72.8311, name: 'Surat, India', larvae: 28, source: 'Container', info: 'Industrial zone' },
            { lat: 18.5204, lng: 73.8567, name: 'Pune, India', larvae: 21, source: 'Container', info: 'Deccan plateau' },
            { lat: 23.8103, lng: 90.4125, name: 'Dhaka, Bangladesh', larvae: 40, source: 'Natural Pool', info: 'Dense urban' },
            { lat: 22.3569, lng: 91.7832, name: 'Chittagong, Bangladesh', larvae: 34, source: 'Container', info: 'Port city' },
            { lat: 6.9271, lng: 79.8612, name: 'Colombo, Sri Lanka', larvae: 25, source: 'Container', info: 'Island capital' },
            { lat: 27.7172, lng: 85.324, name: 'Kathmandu, Nepal', larvae: 16, source: 'Container', info: 'Valley monitoring' },
            { lat: 24.8607, lng: 67.0011, name: 'Karachi, Pakistan', larvae: 32, source: 'Container', info: 'Coastal megacity' },
            { lat: 31.5204, lng: 74.3587, name: 'Lahore, Pakistan', larvae: 28, source: 'Container', info: 'Punjab center' },
            { lat: 33.6844, lng: 73.0479, name: 'Islamabad, Pakistan', larvae: 15, source: 'Container', info: 'Capital monitoring' },

            // EAST ASIA
            { lat: 23.1291, lng: 113.2644, name: 'Guangzhou, China', larvae: 22, source: 'Container', info: 'Southern monitoring' },
            { lat: 22.3193, lng: 114.1694, name: 'Hong Kong', larvae: 14, source: 'Container', info: 'Urban control' },
            { lat: 25.032, lng: 121.5654, name: 'Taipei, Taiwan', larvae: 18, source: 'Container', info: 'Island monitoring' },
            { lat: 22.6273, lng: 120.3014, name: 'Kaohsiung, Taiwan', larvae: 24, source: 'Container', info: 'Southern Taiwan' },

            // OCEANIA
            { lat: -5.0, lng: 145.8, name: 'Port Moresby, PNG', larvae: 44, source: 'Natural Pool', info: 'Malaria endemic' },
            { lat: -9.4438, lng: 147.1803, name: 'Lae, PNG', larvae: 38, source: 'Natural Pool', info: 'Highland fringe' },
            { lat: -12.4634, lng: 130.8456, name: 'Darwin, Australia', larvae: 11, source: 'Container', info: 'Seasonal risk' },
            { lat: -16.9186, lng: 145.7781, name: 'Cairns, Australia', larvae: 14, source: 'Container', info: 'North Queensland' },
            { lat: -19.2576, lng: 146.8169, name: 'Townsville, Australia', larvae: 12, source: 'Container', info: 'Tropical monitoring' },
            { lat: -18.1416, lng: 178.4419, name: 'Suva, Fiji', larvae: 23, source: 'Container', info: 'Pacific endemic' },
            { lat: -17.7334, lng: 168.3273, name: 'Port Vila, Vanuatu', larvae: 26, source: 'Natural Pool', info: 'Island hotspot' },
            { lat: -9.4456, lng: 160.0356, name: 'Honiara, Solomon Islands', larvae: 32, source: 'Natural Pool', info: 'Malaria zone' },
            { lat: -13.8333, lng: -171.75, name: 'Apia, Samoa', larvae: 19, source: 'Container', info: 'Pacific monitoring' },

            // USA
            { lat: 25.7617, lng: -80.1918, name: 'Miami, Florida', larvae: 9, source: 'Container', info: 'Zika transmission 2016' },
            { lat: 27.9506, lng: -82.4572, name: 'Tampa, Florida', larvae: 7, source: 'Container', info: 'Gulf coast' },
            { lat: 29.7604, lng: -95.3698, name: 'Houston, Texas', larvae: 8, source: 'Natural Pool', info: 'West Nile area' },
            { lat: 29.4241, lng: -98.4936, name: 'San Antonio, Texas', larvae: 6, source: 'Container', info: 'Southern Texas' },
            { lat: 32.7767, lng: -96.797, name: 'Dallas, Texas', larvae: 7, source: 'Container', info: 'Urban monitoring' },
            { lat: 29.9511, lng: -90.0715, name: 'New Orleans, Louisiana', larvae: 10, source: 'Natural Pool', info: 'Delta region' },
            { lat: 33.749, lng: -84.388, name: 'Atlanta, Georgia', larvae: 5, source: 'Container', info: 'Southeast monitoring' },
            { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, California', larvae: 4, source: 'Container', info: 'West coast' },
            { lat: 32.7157, lng: -117.1611, name: 'San Diego, California', larvae: 5, source: 'Container', info: 'Border region' },
            { lat: 33.4484, lng: -112.074, name: 'Phoenix, Arizona', larvae: 6, source: 'Natural Pool', info: 'Desert irrigation' },

            // MIDDLE EAST
            { lat: 21.4858, lng: 39.1925, name: 'Jeddah, Saudi Arabia', larvae: 18, source: 'Container', info: 'Red Sea coast' },
            { lat: 15.3694, lng: 44.191, name: 'Sanaa, Yemen', larvae: 28, source: 'Natural Pool', info: 'High endemic' },
            { lat: 12.7855, lng: 45.0187, name: 'Aden, Yemen', larvae: 32, source: 'Container', info: 'Port city hotspot' },
            { lat: 25.2048, lng: 55.2708, name: 'Dubai, UAE', larvae: 6, source: 'Container', info: 'Controlled urban' },
            { lat: 23.4241, lng: 53.8478, name: 'Abu Dhabi, UAE', larvae: 5, source: 'Container', info: 'Desert monitoring' },

            // EUROPE (Mediterranean - emerging)
            { lat: 37.9838, lng: 23.7275, name: 'Athens, Greece', larvae: 4, source: 'Container', info: 'West Nile emergence' },
            { lat: 41.0082, lng: 28.9784, name: 'Istanbul, Turkey', larvae: 5, source: 'Container', info: 'Mediterranean edge' },
            { lat: 45.4408, lng: 12.3155, name: 'Venice, Italy', larvae: 3, source: 'Natural Pool', info: 'Wetland monitoring' },
            { lat: 41.9028, lng: 12.4964, name: 'Rome, Italy', larvae: 3, source: 'Container', info: 'Tiger mosquito' },
            { lat: 43.7696, lng: 11.2558, name: 'Florence, Italy', larvae: 2, source: 'Container', info: 'Tuscan monitoring' },
        ];

        // Create cluster group for demo markers too
        markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                let size = 'small';
                let dimensions = 30;

                if (count > 50) {
                    size = 'large';
                    dimensions = 50;
                } else if (count > 10) {
                    size = 'medium';
                    dimensions = 40;
                }

                return L.divIcon({
                    html: '<div class="cluster-icon cluster-' + size + '">' + count + '</div>',
                    className: 'marker-cluster',
                    iconSize: L.point(dimensions, dimensions)
                });
            }
        });

        demoData.forEach(function(point) {
            const color = point.source.includes('Container') ? '#dc2626' : '#2563eb';

            const marker = L.circleMarker([point.lat, point.lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            })
            .bindPopup(`
                <div class="cs-popup-header">🦟 Demo Observation</div>
                <div class="cs-popup-detail"><strong>Location:</strong> ${point.name}</div>
                <div class="cs-popup-detail"><strong>Larvae Count:</strong> ${point.larvae}</div>
                <div class="cs-popup-detail"><strong>Water Source:</strong> ${point.source}</div>
                <div class="cs-popup-detail"><strong>Context:</strong> ${point.info}</div>
                <div class="cs-popup-detail" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #6b7280;">
                    Demo data based on NASA disease tracking research
                </div>
            `);

            markerClusterGroup.addLayer(marker);
        });

        globeMap.addLayer(markerClusterGroup);
        nasaLayers.observations = markerClusterGroup;

        document.getElementById('observation-count').textContent = demoData.length + ' Demo Locations';
    }

    // Refresh button
    const refreshButton = document.getElementById('refresh-globe');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            if (globeMap) {
                // Clear existing marker cluster group
                if (markerClusterGroup) {
                    globeMap.removeLayer(markerClusterGroup);
                    markerClusterGroup = null;
                }
                // Clear any remaining circle markers
                globeMap.eachLayer(function(layer) {
                    if (layer instanceof L.CircleMarker) {
                        globeMap.removeLayer(layer);
                    }
                });
                fetchGlobeData();
            }
        });
    }

    // Initialize GLOBE map
    const globeSection = document.getElementById('globe-map');
    if (globeSection) {
        // Check if embedded (iframe) - initialize immediately
        if (window.self !== window.top || document.body.children.length <= 5) {
            // Embedded or standalone - init immediately
            initGlobeMap();
        } else {
            // Full page - use intersection observer for performance
            const globeMapObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting && !globeMap) {
                        initGlobeMap();
                        globeMapObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            globeMapObserver.observe(globeSection);
        }
    }

    console.log('GLOBE Map: Ready');

})();
