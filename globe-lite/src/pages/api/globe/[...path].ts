import type { APIRoute } from 'astro';

export const prerender = false;

const API_BASE = import.meta.env.GLOBE_API_BASE_URL || 'https://api.globe.gov';
const API_KEY = import.meta.env.GLOBE_API_KEY || '';
const API_KEY_HEADER = import.meta.env.GLOBE_API_KEY_HEADER || 'x-api-key';

export const ALL: APIRoute = async ({ request, params }) => {
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path || '';
  const baseUrl = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
  const expectedOrigin = new URL(API_BASE).origin;
  const targetUrl = new URL(path.replace(/^\//, ''), baseUrl);

  // Prevent SSRF: ensure the target URL stays within the expected API origin
  if (targetUrl.origin !== expectedOrigin) {
    return new Response(
      JSON.stringify({ error: 'Invalid proxy target' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const requestUrl = new URL(request.url);

  requestUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('content-length');

  if (API_KEY) {
    headers.set(API_KEY_HEADER, API_KEY);
  }

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  try {
    const upstreamResponse = await fetch(targetUrl.toString(), {
      method,
      headers,
      body
    });

    const responseBody = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete('content-encoding');

    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Proxy request failed' }),
      { status: 502, headers: { 'content-type': 'application/json' } }
    );
  }
};
