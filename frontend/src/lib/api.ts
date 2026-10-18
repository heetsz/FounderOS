export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Fact {
  key: string;
  kind: string;
  text: string;
  confidence: number;
  numeric_value?: number;
  updated_at?: number;
  source_episode?: string;
  source_agent?: string;
}
export type FactItem = Fact;
export type TaskItem = Task;

export interface Episode {
  id: string;
  agent: string;
  summary: string;
  ts: number;
}

export interface Handoff {
  from_agent: string;
  to_agent: string;
  reason: string;
  ts: number;
  from_episode?: string;
  to_episode?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  title: string;
  color: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Artifact {
  id: string;
  type: string;
  title: string;
  content: string;
  version: number;
  updated_at?: number;
}

export interface Task {
  id: string;
  title: string;
  timeframe: string;
  status: string;
  owner: string;
  source_decision?: string;
}

export interface FounderInfo {
  founder_id: string;
  name: string;
  startup_name: string;
  idea: string;
  stage: string;
}

export async function fetchFounderInfo(founderId: string): Promise<FounderInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/founders/${founderId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createFounder(data: {
  name: string;
  startup_name: string;
  idea: string;
  stage: string;
  founder_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/founders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create founder");
  return await res.json();
}

export async function seedDemoFounder(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/founders/seed-demo`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to seed demo founder");
  return await res.json();
}

export async function fetchFacts(founderId: string): Promise<Fact[]> {
  const res = await fetch(`${API_BASE}/api/memory/facts?founder_id=${founderId}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchEpisodes(founderId: string): Promise<Episode[]> {
  const res = await fetch(`${API_BASE}/api/memory/episodes?founder_id=${founderId}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchHandoffs(founderId: string): Promise<Handoff[]> {
  const res = await fetch(`${API_BASE}/api/memory/handoffs?founder_id=${founderId}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchGraph(founderId: string): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/api/memory/graph?founder_id=${founderId}`);
  if (!res.ok) return { nodes: [], edges: [] };
  return await res.json();
}

export async function fetchArtifacts(founderId: string): Promise<Artifact[]> {
  const res = await fetch(`${API_BASE}/api/artifacts?founder_id=${founderId}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function fetchTasks(founderId: string): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/api/tasks?founder_id=${founderId}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function updateTaskStatus(taskId: string, status: string, founderId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}?founder_id=${founderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return await res.json();
}

export async function runSimulation(numFounders: number = 50): Promise<any> {
  const res = await fetch(`${API_BASE}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ num_founders: numFounders }),
  });
  if (!res.ok) throw new Error("Simulation failed");
  return await res.json();
}

export async function streamChat(
  founderId: string,
  message: string,
  signal: AbortSignal,
  callbacks: {
    onToken: (token: string, agent: string) => void;
    onAgentChanged: (agent: string, reason: string) => void;
    onHandoff: (fromAgent: string, toAgent: string, reason: string) => void;
    onMemoryRead: (data: any) => void;
    onMemoryWritten: (data: any) => void;
    onDone: (data: any) => void;
    onError: (err: any) => void;
  }
) {
  try {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        founder_id: founderId,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No readable stream");

    const decoder = new TextDecoder();
    let buffer = "";
    let completed = false;

    const dispatchEvent = (block: string) => {
      if (!block.trim()) return;

      let eventName = "message";
      const dataLines: string[] = [];
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith("event:")) {
          eventName = line.slice("event:".length).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice("data:".length).trimStart());
        }
      }

      if (dataLines.length === 0) return;

      try {
        const parsed = JSON.parse(dataLines.join("\n"));
        if (eventName === "token") {
          callbacks.onToken(parsed.token, parsed.agent);
        } else if (eventName === "agent_changed") {
          callbacks.onAgentChanged(parsed.agent, parsed.reason);
        } else if (eventName === "handoff") {
          callbacks.onHandoff(parsed.from_agent, parsed.to_agent, parsed.reason);
        } else if (eventName === "memory_read") {
          callbacks.onMemoryRead(parsed);
        } else if (eventName === "memory_written") {
          callbacks.onMemoryWritten(parsed);
        } else if (eventName === "done") {
          completed = true;
          callbacks.onDone(parsed);
        } else if (eventName === "error") {
          callbacks.onError(parsed.error);
        }
      } catch (error) {
        console.warn("Failed to parse a chat event:", error, block);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";
      blocks.forEach(dispatchEvent);
    }

    if (buffer.trim()) dispatchEvent(buffer);
    if (!completed) callbacks.onError("The chat stream ended before the agent completed its response.");
  } catch (err) {
    if (!(err instanceof DOMException && err.name === "AbortError")) {
      callbacks.onError(err);
    }
  }
}
