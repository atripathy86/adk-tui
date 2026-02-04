import { homedir } from "os";
import { join } from "path";
import { mkdir, readFile, writeFile } from "fs/promises";

export interface ServerConfig {
  name: string;
  url: string;
}

export interface ADKTUIConfig {
  // Server configuration
  servers: ServerConfig[];
  defaultServer?: string;

  // App configuration
  defaultApp?: string;
  defaultUserId?: string;

  // UI configuration
  theme?: string;

  // Keybinds (overrides)
  keybinds?: Record<string, string>;
}

const DEFAULT_CONFIG: ADKTUIConfig = {
  servers: [],
  defaultUserId: "default-user",
  theme: "opencode",
};

function getConfigDir(): string {
  return join(homedir(), ".config", "adk-tui");
}

function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

export async function loadConfig(): Promise<ADKTUIConfig> {
  try {
    const configPath = getConfigPath();
    const content = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(content);
    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (error) {
    // Config doesn't exist or is invalid, return defaults
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: ADKTUIConfig): Promise<void> {
  try {
    const configDir = getConfigDir();
    const configPath = getConfigPath();

    // Ensure config directory exists
    await mkdir(configDir, { recursive: true });

    // Write config
    await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save config:", error);
    throw error;
  }
}

export async function updateConfig(
  updates: Partial<ADKTUIConfig>
): Promise<ADKTUIConfig> {
  const current = await loadConfig();
  const updated = { ...current, ...updates };
  await saveConfig(updated);
  return updated;
}

// Helper to get server URL by name
export function getServerUrl(
  config: ADKTUIConfig,
  name?: string
): string | null {
  const serverName = name ?? config.defaultServer;
  if (!serverName) return null;

  const server = config.servers.find((s) => s.name === serverName);
  return server?.url ?? null;
}

// Helper to add a new server
export async function addServer(
  name: string,
  url: string
): Promise<ADKTUIConfig> {
  const config = await loadConfig();

  // Remove existing server with same name
  config.servers = config.servers.filter((s) => s.name !== name);

  // Add new server
  config.servers.push({ name, url });

  await saveConfig(config);
  return config;
}

// Helper to remove a server
export async function removeServer(name: string): Promise<ADKTUIConfig> {
  const config = await loadConfig();

  config.servers = config.servers.filter((s) => s.name !== name);

  // Clear default if removed
  if (config.defaultServer === name) {
    config.defaultServer = config.servers[0]?.name;
  }

  await saveConfig(config);
  return config;
}
