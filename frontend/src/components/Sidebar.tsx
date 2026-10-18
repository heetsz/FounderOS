"use client";

import React from "react";
import {
  LayoutDashboard,
  Bot,
  BrainCircuit,
  GitCommit,
  FileText,
  CheckSquare,
  Zap,
  Sparkles,
} from "lucide-react";
import { AGENT_CONFIG } from "./AgentBadge";

export type NavItem =
  | "dashboard"
  | "workspace"
  | "memory"
  | "timeline"
  | "artifacts"
  | "tasks"
  | "simulate";

interface SidebarProps {
  currentTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  founderId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  founderId,
}) => {
  const NAV_ITEMS: { id: NavItem; label: string; icon: React.ComponentType<{ size: number }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "workspace", label: "Agent Workspace", icon: Bot },
    { id: "memory", label: "Memory Explorer", icon: BrainCircuit },
    { id: "timeline", label: "Handoff Timeline", icon: GitCommit },
    { id: "artifacts", label: "Artifacts", icon: FileText },
    { id: "tasks", label: "Roadmap Tasks", icon: CheckSquare },
    { id: "simulate", label: "Simulate (Demo)", icon: Zap },
  ];

  const AGENTS = [
    { id: "supervisor", name: "Supervisor", dot: AGENT_CONFIG.supervisor.dot },
    { id: "validator", name: "Idea Validator", dot: AGENT_CONFIG.validator.dot },
    { id: "market_scout", name: "Market Scout", dot: AGENT_CONFIG.market_scout.dot },
    { id: "business_model", name: "Business Model", dot: AGENT_CONFIG.business_model.dot },
    { id: "brand_pitch", name: "Brand & Pitch", dot: AGENT_CONFIG.brand_pitch.dot },
    { id: "launch_planner", name: "Launch Planner", dot: AGENT_CONFIG.launch_planner.dot },
  ];

  return (
    <aside className="w-[248px] bg-white border-r border-appBorder h-screen flex flex-col justify-between flex-shrink-0 select-none">
      <div>
        {/* Logo */}
        <div className="h-14 px-5 border-b border-appBorder flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm shadow-sm">
            F
          </div>
          <div>
            <h1 className="font-heading font-bold text-base text-appText tracking-tight flex items-center gap-1.5">
              FounderOS
              <span className="text-[10px] uppercase font-bold px-1.5 rounded bg-primary-tint text-primary">
                v2
              </span>
            </h1>
            <p className="text-[10px] text-textMuted font-medium leading-none">
              Track 2 · FalkorDB Memory
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-btn text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary-tint text-primary font-semibold"
                    : "text-textMuted hover:text-appText hover:bg-surfaceAlt"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.id === "simulate" && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    50x
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Agent Team Status */}
        <div className="px-4 pt-4 border-t border-appBorder/80">
          <h4 className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles size={11} /> Agent Specialists
          </h4>
          <div className="space-y-1.5">
            {AGENTS.map((ag) => (
              <div
                key={ag.id}
                className="flex items-center justify-between text-[11px] text-slate-700 py-1 px-2 rounded hover:bg-surfaceAlt transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ag.dot }}
                  />
                  <span>{ag.name}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" title="Online" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-appBorder bg-slate-50/50">
        <div className="text-[10px] text-textMuted uppercase font-semibold">Active Tenant</div>
        <div className="font-mono text-xs text-appText truncate font-medium">
          fos_{founderId}
        </div>
        <div className="text-[10px] text-success flex items-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> FalkorDB Graph Ready
        </div>
      </div>
    </aside>
  );
};
