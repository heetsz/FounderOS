"use client";

import React from "react";
import { Database, UserPlus, Sparkles, RefreshCw } from "lucide-react";
import { FounderInfo } from "@/lib/api";

interface TopBarProps {
  founderInfo: FounderInfo | null;
  onOpenOnboarding: () => void;
  onSeedDemo: () => void;
  isLoading?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  founderInfo,
  onOpenOnboarding,
  onSeedDemo,
  isLoading,
}) => {
  return (
    <header className="h-14 bg-surface border-b border-appBorder px-6 flex items-center justify-between flex-shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-sm text-appText truncate max-w-xs">
              {founderInfo?.startup_name || "HealthSync AI"}
            </span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {founderInfo?.stage || "Validation"}
            </span>
          </div>
          <p className="text-[11px] text-textMuted truncate max-w-md hidden sm:block">
            {founderInfo?.idea || "AI-powered diagnostic copilot and EHR triage workspace for independent primary care clinics"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* FalkorDB Connection Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono border border-appBorder">
          <Database size={12} className="text-primary" />
          <span>FalkorDB:</span>
          <span className="text-success font-semibold">fos_{founderInfo?.founder_id || "demo_founder"}</span>
        </div>

        {/* Demo Founder Seed button */}
        <button
          onClick={onSeedDemo}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-surfaceAlt hover:bg-slate-200 text-appText text-xs font-medium border border-appBorder transition-colors disabled:opacity-50"
          title="Reset & load pre-seeded demo founder"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin text-primary" : "text-textMuted"} />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        {/* New Founder button */}
        <button
          onClick={onOpenOnboarding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <UserPlus size={13} />
          <span>New Founder</span>
        </button>
      </div>
    </header>
  );
};

