// src/lib/globe-api.ts

export type Protocol =
  | 'mosquito_habitat_mapper'
  | 'clouds'
  | 'land_covers'
  | 'tree_heights'
  | 'sky_conditions';

export interface GlobeQueryParams {
  protocols: Protocol | Protocol[];
  startdate: string;  // YYYY-MM-DD
  enddate: string;    // YYYY-MM-DD
  geojson?: boolean;
  sample?: boolean;
}

export interface GlobeObservation {
  id: string;
  protocol: Protocol;
  measuredDate: string;
  latitude: number;
  longitude: number;
  data: Record<string, any>;
  photos?: string[];
}

export interface GeoJSONResponse {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
    properties: Record<string, any>;
  }>;
}

const BASE_URL = 'https://api.globe.gov';

/**
 * Fetch observations from GLOBE API
 */
export async function fetchObservations(
  params: GlobeQueryParams
): Promise<GeoJSONResponse> {
  const protocols = Array.isArray(params.protocols)
    ? params.protocols.join(',')
    : params.protocols;

  const url = new URL(`${BASE_URL}/search/v1/measurement/protocol/measureddate/`);
  url.searchParams.set('protocols', protocols);
  url.searchParams.set('startdate', params.startdate);
  url.searchParams.set('enddate', params.enddate);
  url.searchParams.set('geojson', String(params.geojson ?? true));
  url.searchParams.set('sample', String(params.sample ?? false));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`GLOBE API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get recent mosquito observations (last 30 days)
 */
export async function getRecentMosquitoObservations(
  sample = true
): Promise<GeoJSONResponse> {
  const enddate = new Date().toISOString().split('T')[0];
  const startdate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  return fetchObservations({
    protocols: 'mosquito_habitat_mapper',
    startdate,
    enddate,
    geojson: true,
    sample
  });
}

/**
 * Get observations for a specific region (bounding box)
 * Note: GLOBE API may not support bbox - this filters client-side
 */
export function filterByBounds(
  data: GeoJSONResponse,
  bounds: { north: number; south: number; east: number; west: number }
): GeoJSONResponse {
  return {
    type: 'FeatureCollection',
    features: data.features.filter(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      );
    })
  };
}

/**
 * Format date for GLOBE API
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range for last N days
 */
export function getLastNDays(n: number): { startdate: string; enddate: string } {
  const enddate = formatDate(new Date());
  const startdate = formatDate(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
  return { startdate, enddate };
}