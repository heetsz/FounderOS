import React from "react";
import { Fact } from "@/lib/api";
import { Sparkles, CheckCircle2, Clock } from "lucide-react";

interface MemoryCardProps {
  fact: Fact;
  isNew?: boolean;
}

const KIND_COLORS: Record<string, { bg: string; text: string }> = {
  customer: { bg: "#EEF2FF", text: "#4338CA" },
  problem: { bg: "#FEF2F2", text: "#B91C1C" },
  competitor: { bg: "#F0F9FF", text: "#0369A1" },
  market: { bg: "#F0FDF4", text: "#15803D" },
  pricing: { bg: "#FFFBEB", text: "#B45309" },
  metric: { bg: "#FAF5FF", text: "#7E22CE" },
  strategy: { bg: "#FDF2F8", text: "#BE185D" },
};

export const MemoryCard: React.FC<MemoryCardProps> = ({ fact, isNew }) => {
  const kindStyle = KIND_COLORS[fact.kind.toLowerCase()] || { bg: "#F1F5F9", text: "#475569" };
  const confidencePercent = Math.round((fact.confidence || 0.9) * 100);

  return (
    <div
      className={`rounded-card p-3 border transition-all duration-200 ${
        isNew
          ? "bg-[#EEF2FF] border-[#C7D2FE] shadow-sm animate-fade-in"
          : "bg-surface border-appBorder hover:border-[#CBD5E1] shadow-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: kindStyle.bg, color: kindStyle.text }}
          >
            {fact.kind}
          </span>
          <span className="font-mono text-xs text-textMuted font-medium truncate max-w-[120px]">
            {fact.key}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-success">
          <CheckCircle2 size={12} />
          <span>{confidencePercent}%</span>
        </div>
      </div>

      <p className="text-xs text-appText leading-relaxed mb-2 font-normal">
        {fact.text}
      </p>

      <div className="flex items-center justify-between text-[10px] text-textMuted border-t border-appBorder/60 pt-1.5">
        <div className="flex items-center gap-1">
          {isNew && (
            <span className="flex items-center gap-0.5 text-primary font-medium">
              <Sparkles size={10} /> Just written
            </span>
          )}
          {!isNew && fact.source_agent && (
            <span>via {fact.source_agent}</span>
          )}
        </div>
        {fact.updated_at && (
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {new Date(fact.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
};

