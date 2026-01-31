import type { APIRoute } from 'astro';

export const prerender = false;

const UPLOAD_PATH = import.meta.env.GLOBE_UPLOAD_URL || '';
const API_BASE = import.meta.env.GLOBE_API_BASE_URL || 'https://api.globe.gov';
const API_KEY = import.meta.env.GLOBE_API_KEY || '';
const API_KEY_HEADER = import.meta.env.GLOBE_API_KEY_HEADER || 'x-api-key';

export const POST: APIRoute = async ({ request }) => {
  if (!UPLOAD_PATH) {
    return new Response(
      JSON.stringify({ error: 'GLOBE_UPLOAD_URL is not configured.' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GLOBE_API_KEY is not configured.' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('content-length');
  headers.set(API_KEY_HEADER, API_KEY);

  try {
    const body = await request.arrayBuffer();
    const resolvedUploadUrl = UPLOAD_PATH.startsWith('http')
      ? UPLOAD_PATH
      : new URL(
          UPLOAD_PATH.replace(/^\//, ''),
          API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`
        ).toString();
    const upstreamResponse = await fetch(resolvedUploadUrl, {
      method: 'POST',
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Upload proxy failed' }),
      { status: 502, headers: { 'content-type': 'application/json' } }
    );
  }
};
