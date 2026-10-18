import React from "react";
import { ArrowRight, Shuffle } from "lucide-react";
import { AGENT_CONFIG } from "./AgentBadge";

interface HandoffChipProps {
  fromAgent: string;
  toAgent: string;
  reason: string;
}

export const HandoffChip: React.FC<HandoffChipProps> = ({ fromAgent, toAgent, reason }) => {
  const fromCfg = AGENT_CONFIG[fromAgent] || { name: fromAgent, color: "#475569" };
  const toCfg = AGENT_CONFIG[toAgent] || { name: toAgent, color: "#4F46E5" };

  return (
    <div className="my-3 flex items-center justify-center animate-fade-in">
      <div className="bg-surface border border-appBorder shadow-card rounded-full px-4 py-2 flex items-center gap-2.5 text-xs text-appText max-w-xl">
        <div className="w-5 h-5 rounded-full bg-primary-tint text-primary flex items-center justify-center flex-shrink-0">
          <Shuffle size={12} />
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span style={{ color: fromCfg.color }}>{fromCfg.name}</span>
          <ArrowRight size={12} className="text-textMuted" />
          <span style={{ color: toCfg.color }}>{toCfg.name}</span>
        </div>
        <span className="text-textMuted text-[11px] truncate max-w-xs pl-1 border-l border-appBorder">
          {reason}
        </span>
      </div>
    </div>
  );
};

