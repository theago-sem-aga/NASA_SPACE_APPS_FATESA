/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FONTE_DADOS?: 'mock' | 'api';
  readonly VITE_API_URL?: string;
  readonly VITE_SINALIZAR_MOCK?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
