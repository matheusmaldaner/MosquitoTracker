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

const API_DIRECT_BASE = 'https://api.globe.gov';
const API_PROXY_BASE = '/api/globe';
const PUBLIC_API_BASE = import.meta.env.PUBLIC_GLOBE_API_BASE_URL;

function withTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function buildApiUrl(path: string): URL {
  if (typeof window === 'undefined') {
    return new URL(path, withTrailingSlash(API_DIRECT_BASE));
  }
  const resolvedBase = PUBLIC_API_BASE
    ? (PUBLIC_API_BASE.startsWith('http')
        ? PUBLIC_API_BASE
        : `${window.location.origin}${PUBLIC_API_BASE}`)
    : `${window.location.origin}${API_PROXY_BASE}`;
  return new URL(path, withTrailingSlash(resolvedBase));
}

/**
 * Fetch observations from GLOBE API
 */
export async function fetchObservations(
  params: GlobeQueryParams
): Promise<GeoJSONResponse> {
  const protocols = Array.isArray(params.protocols)
    ? params.protocols.join(',')
    : params.protocols;

  const path = 'search/v1/measurement/protocol/measureddate/';
  const url = buildApiUrl(path);
  url.searchParams.set('protocols', protocols);
  url.searchParams.set('startdate', params.startdate);
  url.searchParams.set('enddate', params.enddate);
  url.searchParams.set('geojson', (params.geojson ?? true) ? 'TRUE' : 'FALSE');
  url.searchParams.set('sample', (params.sample ?? false) ? 'TRUE' : 'FALSE');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(await extractApiError(response));
  }

  return response.json();
}

async function extractApiError(response: Response): Promise<string> {
  const statusText = response.statusText ? ` ${response.statusText}` : '';
  const contentType = response.headers.get('content-type') || '';
  let details = '';
  let rawText = '';

  try {
    rawText = await response.text();
  } catch {
    rawText = '';
  }

  if (rawText && (contentType.includes('application/json') || contentType.includes('application/stream+json'))) {
    try {
      const body = JSON.parse(rawText);
      if (body?.message) {
        details = body.message;
      } else if (body?.error) {
        details = body.error;
      } else {
        details = JSON.stringify(body);
      }
    } catch {
      details = rawText;
    }
  } else if (rawText) {
    details = rawText;
  }

  return `GLOBE API error (${response.status}${statusText})${details ? `: ${details}` : ''}`;
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
