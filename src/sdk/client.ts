import { z } from "zod";

// Default ADK server URL - can be overridden via /connect command
export const DEFAULT_ADK_URL = "http://ai02.labs.hpecorp.net:8087";

export interface ADKApp {
  name: string;
  // Add other fields as discovered from OpenAPI
}

export interface ADKClientConfig {
  baseUrl: string;
}

export class ADKClient {
  private _baseUrl: string;

  constructor(baseUrl: string = DEFAULT_ADK_URL) {
    this._baseUrl = baseUrl;
  }

  get baseUrl(): string {
    return this._baseUrl;
  }

  setBaseUrl(url: string): void {
    this._baseUrl = url;
  }

  async listApps(): Promise<string[]> {
    try {
      const response = await fetch(`${this._baseUrl}/list-apps`);
      if (!response.ok) {
        throw new Error(`Failed to list apps: ${response.statusText}`);
      }
      const data = await response.json();
      return data as string[]; 
    } catch (error) {
      console.error("Error listing apps:", error);
      throw error;
    }
  }

  // Placeholder for other methods based on OpenAPI
  // "/apps/{app_name}/users/{user_id}/sessions"
  async getSessions(appName: string, userId: string) {
     const response = await fetch(`${this._baseUrl}/apps/${appName}/users/${userId}/sessions`);
     return response.json();
  }

  // Test connection to server
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this._baseUrl}/list-apps`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance - baseUrl can be changed via setBaseUrl()
export const adkClient = new ADKClient();
