import type {
  Session,
  Event,
  Part,
  AgentRunRequest,
  EvalCase,
  EvalMetric,
  EvalSetResult,
  RunEvalResult,
  AddSessionToEvalSetRequest,
} from "./types";

// Default ADK server URL - set via /connect command
export const DEFAULT_ADK_URL = "";

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

  // ============================================================================
  // Apps
  // ============================================================================

  async listApps(): Promise<string[]> {
    const response = await fetch(`${this._baseUrl}/list-apps`);
    if (!response.ok) {
      throw new Error(`Failed to list apps: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // Sessions
  // ============================================================================

  async listSessions(appName: string, userId: string): Promise<Session[]> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions`
    );
    if (!response.ok) {
      throw new Error(`Failed to list sessions: ${response.statusText}`);
    }
    return response.json();
  }

  async getSession(appName: string, userId: string, sessionId: string): Promise<Session> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }
    return response.json();
  }

  async createSession(
    appName: string,
    userId: string,
    state?: Record<string, unknown>
  ): Promise<Session> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state ?? null),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    return response.json();
  }

  async createSessionWithId(
    appName: string,
    userId: string,
    sessionId: string,
    state?: Record<string, unknown>
  ): Promise<Session> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state ?? null),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteSession(appName: string, userId: string, sessionId: string): Promise<void> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }

  // ============================================================================
  // Agent Execution
  // ============================================================================

  async run(request: AgentRunRequest): Promise<Event[]> {
    const response = await fetch(`${this._baseUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to run agent: ${response.statusText}`);
    }
    return response.json();
  }

  async *runSSE(request: AgentRunRequest): AsyncGenerator<Event, void, unknown> {
    const controller = new AbortController();

    const response = await fetch(`${this._baseUrl}/run_sse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ ...request, streaming: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to start SSE stream: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") return;
            if (data) {
              try {
                const event = JSON.parse(data) as Event;
                yield event;
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith("data: ")) {
        const data = buffer.slice(6).trim();
        if (data && data !== "[DONE]") {
          try {
            yield JSON.parse(data) as Event;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ============================================================================
  // Artifacts
  // ============================================================================

  async listArtifacts(
    appName: string,
    userId: string,
    sessionId: string
  ): Promise<string[]> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/artifacts`
    );
    if (!response.ok) {
      throw new Error(`Failed to list artifacts: ${response.statusText}`);
    }
    return response.json();
  }

  async loadArtifact(
    appName: string,
    userId: string,
    sessionId: string,
    artifactName: string,
    version?: number
  ): Promise<Part | null> {
    let url = `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/artifacts/${encodeURIComponent(artifactName)}`;
    if (version !== undefined) {
      url += `?version=${version}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load artifact: ${response.statusText}`);
    }
    return response.json();
  }

  async loadArtifactVersion(
    appName: string,
    userId: string,
    sessionId: string,
    artifactName: string,
    versionId: number
  ): Promise<Part | null> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/artifacts/${encodeURIComponent(artifactName)}/versions/${versionId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to load artifact version: ${response.statusText}`);
    }
    return response.json();
  }

  async listArtifactVersions(
    appName: string,
    userId: string,
    sessionId: string,
    artifactName: string
  ): Promise<number[]> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/artifacts/${encodeURIComponent(artifactName)}/versions`
    );
    if (!response.ok) {
      throw new Error(`Failed to list artifact versions: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteArtifact(
    appName: string,
    userId: string,
    sessionId: string,
    artifactName: string
  ): Promise<void> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/artifacts/${encodeURIComponent(artifactName)}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      throw new Error(`Failed to delete artifact: ${response.statusText}`);
    }
  }

  // ============================================================================
  // Eval Sets
  // ============================================================================

  async listEvalSets(appName: string): Promise<string[]> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_sets`
    );
    if (!response.ok) {
      throw new Error(`Failed to list eval sets: ${response.statusText}`);
    }
    return response.json();
  }

  async createEvalSet(appName: string, evalSetId: string): Promise<void> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_sets/${encodeURIComponent(evalSetId)}`,
      { method: "POST" }
    );
    if (!response.ok) {
      throw new Error(`Failed to create eval set: ${response.statusText}`);
    }
  }

  async addSessionToEvalSet(
    appName: string,
    evalSetId: string,
    request: AddSessionToEvalSetRequest
  ): Promise<void> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_sets/${encodeURIComponent(evalSetId)}/add_session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to add session to eval set: ${response.statusText}`);
    }
  }

  // ============================================================================
  // Evals
  // ============================================================================

  async listEvals(appName: string, evalSetId: string): Promise<string[]> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_sets/${encodeURIComponent(evalSetId)}/evals`
    );
    if (!response.ok) {
      throw new Error(`Failed to list evals: ${response.statusText}`);
    }
    return response.json();
  }

  async getEval(appName: string, evalSetId: string, evalCaseId: string): Promise<EvalCase> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_sets/${encodeURIComponent(evalSetId)}/evals/${encodeURIComponent(evalCaseId)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get eval: ${response.statusText}`);
    }
    return response.json();
  }

  async updateEval(
    appName: string,
    evalSetId: string,
    evalCaseId: string,
    evalCase: EvalCase
  ): Promise<void> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_sets/${encodeURIComponent(evalSetId)}/evals/${encodeURIComponent(evalCaseId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evalCase),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to update eval: ${response.statusText}`);
    }
  }

  async deleteEval(appName: string, evalSetId: string, evalCaseId: string): Promise<void> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_sets/${encodeURIComponent(evalSetId)}/evals/${encodeURIComponent(evalCaseId)}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      throw new Error(`Failed to delete eval: ${response.statusText}`);
    }
  }

  async runEval(
    appName: string,
    evalSetId: string,
    evalIds: string[],
    evalMetrics: EvalMetric[]
  ): Promise<RunEvalResult[]> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_sets/${encodeURIComponent(evalSetId)}/run_eval`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evalIds, evalMetrics }),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to run eval: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // Eval Results
  // ============================================================================

  async listEvalResults(appName: string): Promise<string[]> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_results`
    );
    if (!response.ok) {
      throw new Error(`Failed to list eval results: ${response.statusText}`);
    }
    return response.json();
  }

  async getEvalResult(appName: string, evalResultId: string): Promise<EvalSetResult> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/eval_results/${encodeURIComponent(evalResultId)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get eval result: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // Debug/Trace
  // ============================================================================

  async getTrace(eventId: string): Promise<unknown> {
    const response = await fetch(
      `${this._baseUrl}/debug/trace/${encodeURIComponent(eventId)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get trace: ${response.statusText}`);
    }
    return response.json();
  }

  async getSessionTrace(sessionId: string): Promise<unknown> {
    const response = await fetch(
      `${this._baseUrl}/debug/trace/session/${encodeURIComponent(sessionId)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get session trace: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // Event Graph
  // ============================================================================

  async getEventGraph(
    appName: string,
    userId: string,
    sessionId: string,
    eventId: string
  ): Promise<unknown> {
    const response = await fetch(
      `${this._baseUrl}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}/events/${encodeURIComponent(eventId)}/graph`
    );
    if (!response.ok) {
      throw new Error(`Failed to get event graph: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // Connection Test
  // ============================================================================

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this._baseUrl}/list-apps`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance - baseUrl can be changed via setBaseUrl()
export const adkClient = new ADKClient();

// Re-export types for convenience
export type { Session, Event, Content, Part, AgentRunRequest } from "./types";
