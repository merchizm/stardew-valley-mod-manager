// Types for our Rust backend responses
export interface GameInfo {
  game_path: string;
  smapi_path?: string;
  has_smapi: boolean;
}

export interface ModInfo {
  name: string;
  version?: string;
  author?: string;
  description?: string;
  path: string;
  folder_name: string;
  has_manifest: boolean;
  manifest_data?: any;
}

export interface ModList {
  active: ModInfo[];
  deactivated: ModInfo[];
  invalid: ModInfo[];
}

export interface LanguageResponse {
  language: string;
  translations: Record<string, any>;
}

export interface ThemeResponse {
  theme: string;
}

export type ModCategory = 'active' | 'deactivated' | 'invalid';