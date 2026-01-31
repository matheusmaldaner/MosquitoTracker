/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GLOBE_API_BASE_URL?: string;
  readonly GLOBE_API_KEY?: string;
  readonly GLOBE_API_KEY_HEADER?: string;
  readonly GLOBE_UPLOAD_URL?: string;
  readonly GLOBE_STATS_STARTDATE?: string;
  readonly PUBLIC_GLOBE_API_BASE_URL?: string;
  readonly PUBLIC_GLOBE_UPLOAD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
