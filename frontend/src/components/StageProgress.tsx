import React from "react";
import { Check, ShieldCheck, Search, Calculator, Sparkles, Rocket } from "lucide-react";

interface StageProgressProps {
  currentStage?: string;
  completedStages?: string[];
  onSelectStage?: (stage: string) => void;
}

const STAGES = [
  { id: "validate", label: "Validate", icon: ShieldCheck, desc: "Problem & ICP validation" },
  { id: "research", label: "Research", icon: Search, desc: "Market & competitors" },
  { id: "model", label: "Model", icon: Calculator, desc: "Pricing & economics" },
  { id: "brand", label: "Brand", icon: Sparkles, desc: "Pitch & identity" },
  { id: "launch", label: "Launch", icon: Rocket, desc: "30-60-90 roadmap" },
];

export const StageProgress: React.FC<StageProgressProps> = ({
  currentStage = "research",
  completedStages = ["validate"],
  onSelectStage,
}) => {
  return (
    <div className="bg-surface border border-appBorder rounded-card p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-textMuted">
          Venture Milestones
        </h3>
        <span className="text-xs font-medium text-primary bg-primary-tint px-2.5 py-0.5 rounded-full">
          Stage: {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 relative">
        {STAGES.map((st, idx) => {
          const isDone = completedStages.includes(st.id);
          const isCurrent = currentStage.toLowerCase() === st.id;
          const Icon = st.icon;

          return (
            <button
              key={st.id}
              onClick={() => onSelectStage?.(st.id)}
              className={`flex flex-col items-center text-center p-2.5 rounded-lg border transition-all duration-150 ${
                isCurrent
                  ? "border-primary bg-primary-tint/60 ring-2 ring-primary/20"
                  : isDone
                  ? "border-success/40 bg-success/5 hover:bg-success/10"
                  : "border-appBorder bg-surface hover:bg-surfaceAlt"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                  isCurrent
                    ? "bg-primary text-white"
                    : isDone
                    ? "bg-success text-white"
                    : "bg-surfaceAlt text-textMuted"
                }`}
              >
                {isDone ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <span className="text-xs font-semibold text-appText truncate w-full">
                {st.label}
              </span>
              <span className="text-[10px] text-textMuted hidden md:block truncate w-full">
                {st.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

