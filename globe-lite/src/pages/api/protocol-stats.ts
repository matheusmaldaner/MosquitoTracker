import type { APIRoute } from 'astro';

export const prerender = false;

const API_BASE = import.meta.env.GLOBE_API_BASE_URL || 'https://api.globe.gov';
const API_KEY = import.meta.env.GLOBE_API_KEY || '';
const API_KEY_HEADER = import.meta.env.GLOBE_API_KEY_HEADER || 'x-api-key';
const TOTAL_STARTDATE = import.meta.env.GLOBE_STATS_STARTDATE || '1995-01-01';

function withTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function fetchCount(protocol: string, startdate: string, enddate: string): Promise<number> {
  const url = new URL('search/v1/measurement/protocol/measureddate/', withTrailingSlash(API_BASE));
  url.searchParams.set('protocols', protocol);
  url.searchParams.set('startdate', startdate);
  url.searchParams.set('enddate', enddate);
  url.searchParams.set('geojson', 'FALSE');
  url.searchParams.set('sample', 'TRUE');

  const headers = API_KEY ? { [API_KEY_HEADER]: API_KEY } : undefined;

  try {
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      console.error(`GLOBE API error for ${protocol}: ${response.status}`);
      return -1; // Return -1 to indicate error but don't throw
    }

    const data = await response.json();
    if (typeof data?.count === 'number') {
      return data.count;
    }

    if (Array.isArray(data?.results)) {
      return data.results.length;
    }

    return 0;
  } catch (error) {
    console.error(`Failed to fetch ${protocol}:`, error);
    return -1;
  }
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const protocolsParam = url.searchParams.get('protocols');
  const protocols = protocolsParam
    ? protocolsParam.split(',').map((p) => p.trim()).filter(Boolean)
    : ['sky_conditions', 'mosquito_habitat_mapper', 'land_covers', 'tree_heights'];

  const parsedDays = Number(url.searchParams.get('days') || '7');
  const days = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 7;
  const enddate = formatDate(new Date());
  const startdate = formatDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  const totalStart = url.searchParams.get('totalStart') || TOTAL_STARTDATE;

  const results = await Promise.all(
    protocols.map(async (protocol) => {
      const [week, total] = await Promise.all([
        fetchCount(protocol, startdate, enddate),
        fetchCount(protocol, totalStart, enddate)
      ]);

      // Convert -1 (error) to null for cleaner API response
      return [protocol, {
        week: week === -1 ? null : week,
        total: total === -1 ? null : total
      }];
    })
  );

  return new Response(
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      startdate,
      enddate,
      protocols: Object.fromEntries(results)
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
};
