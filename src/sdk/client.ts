import { z } from "zod";

const ADK_BASE_URL = "http://ai02.labs.hpecorp.net:8087";

export interface ADKApp {
  name: string;
  // Add other fields as discovered from OpenAPI
}

export class ADKClient {
  private baseUrl: string;

  constructor(baseUrl: string = ADK_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async listApps(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list-apps`);
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
     const response = await fetch(`${this.baseUrl}/apps/${appName}/users/${userId}/sessions`);
     return response.json();
  }
}

export const adkClient = new ADKClient();
