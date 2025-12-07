/**
 * Module Configuration
 *
 * Defines available modules and their metadata
 */

export interface ModuleConfig {
  name: string;
  displayName: string;
  description?: string;
}

/**
 * Registry of available Bürokratt modules
 */
export const MODULES: Record<string, ModuleConfig> = {
  "service-module": {
    name: "service-module",
    displayName: "Service Module",
    description: "Main service module with frontend and backend components",
  },
};

/**
 * Get module configuration by name
 */
export function getModule(name: string): ModuleConfig | undefined {
  return MODULES[name];
}

/**
 * List all available module names
 */
export function listModuleNames(): string[] {
  return Object.keys(MODULES);
}

/**
 * Check if a module exists
 */
export function moduleExists(name: string): boolean {
  return name in MODULES;
}
