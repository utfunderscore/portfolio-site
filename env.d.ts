/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SHOW_ISLAND_CONTROLS?: "true" | "false";
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
