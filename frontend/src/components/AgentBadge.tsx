import React from "react";

export const AGENT_CONFIG: Record<string, { name: string; color: string; bg: string; dot: string }> = {
  supervisor: {
    name: "Supervisor",
    color: "#475569",
    bg: "#F1F5F9",
    dot: "#475569",
  },
  validator: {
    name: "Idea Validator",
    color: "#6366F1",
    bg: "#EEF2FF",
    dot: "#6366F1",
  },
  market_scout: {
    name: "Market Scout",
    color: "#0284C7",
    bg: "#F0F9FF",
    dot: "#0EA5E9",
  },
  business_model: {
    name: "Business Model",
    color: "#059669",
    bg: "#ECFDF5",
    dot: "#10B981",
  },
  brand_pitch: {
    name: "Brand & Pitch",
    color: "#D97706",
    bg: "#FFFBEB",
    dot: "#F59E0B",
  },
  launch_planner: {
    name: "Launch Planner",
    color: "#DB2777",
    bg: "#FDF2F8",
    dot: "#EC4899",
  },
  curator: {
    name: "Memory Curator",
    color: "#6D28D9",
    bg: "#F5F3FF",
    dot: "#8B5CF6",
  },
};

interface AgentBadgeProps {
  agent: string;
  size?: "sm" | "md";
}

export const AgentBadge: React.FC<AgentBadgeProps> = ({ agent, size = "md" }) => {
  const normalizedKey = agent.toLowerCase().replace("-", "_").replace(" ", "_");
  const config = AGENT_CONFIG[normalizedKey] || {
    name: agent,
    color: "#475569",
    bg: "#F1F5F9",
    dot: "#475569",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
        style={{ backgroundColor: config.dot }}
      />
      {config.name}
    </span>
  );
};

