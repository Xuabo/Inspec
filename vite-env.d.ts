// Removed reference to vite/client which was causing "Cannot find type definition file" error.
// Manually declaring types for import.meta.env and process.env

interface ImportMetaEnv {
  readonly API_KEY: string;
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
