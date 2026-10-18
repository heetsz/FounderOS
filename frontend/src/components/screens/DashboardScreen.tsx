"use client";

import React from "react";
import { Fact, Task, Episode, FounderInfo } from "@/lib/api";
import { StageProgress } from "@/components/StageProgress";
import { AgentBadge } from "@/components/AgentBadge";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  BrainCircuit,
  FileText,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";

interface DashboardScreenProps {
  founderInfo: FounderInfo | null;
  facts: Fact[];
  tasks: Task[];
  episodes: Episode[];
  onNavigate: (tab: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  founderInfo,
  facts,
  tasks,
  episodes,
  onNavigate,
}) => {
  // Compute stage based on available facts/tasks
  const hasValidation = facts.some((f) => f.kind === "customer" || f.key.includes("icp"));
  const hasMarket = facts.some((f) => f.kind === "competitor" || f.key.includes("tam"));
  const hasPricing = facts.some((f) => f.kind === "pricing");

  const completedStages = ["validate"];
  if (hasMarket) completedStages.push("research");
  if (hasPricing) completedStages.push("model");

  const currentStage = hasPricing ? "brand" : hasMarket ? "model" : "research";

  const NEXT_ACTIONS = [
    {
      title: "Evaluate Pricing Unit Economics",
      agent: "business_model",
      desc: "Simulate gross margin and customer payback period under $199/clinician plan.",
      actionText: "Chat with Business Model",
      tab: "workspace",
    },
    {
      title: "Inspect Competitor Knowledge Graph",
      agent: "market_scout",
      desc: "Analyze how HealthSync AI differentiates from Abridge and Nabla.",
      actionText: "Open Memory Explorer",
      tab: "memory",
    },
    {
      title: "Draft 10-Slide Investor Deck",
      agent: "brand_pitch",
      desc: "Synthesize problem urgency and TAM sizing into an investor-ready one-pager.",
      actionText: "Generate Pitch Outline",
      tab: "workspace",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-primary/10 via-indigo-50/50 to-surface border border-appBorder rounded-card p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-tint px-2.5 py-0.5 rounded-full">
              Startup Command Center
            </span>
            <span className="text-xs text-textMuted">• Tenant: fos_{founderInfo?.founder_id || "demo_founder"}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-heading text-appText">
            {founderInfo?.startup_name || "HealthSync AI"}
          </h2>
          <p className="text-sm text-textMuted max-w-2xl mt-1 leading-relaxed">
            {founderInfo?.idea || "AI-powered diagnostic copilot and EHR triage workspace for independent primary care clinics."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onNavigate("workspace")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-card bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Launch Agent Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 5-Stage Milestone Progress */}
      <StageProgress
        currentStage={currentStage}
        completedStages={completedStages}
        onSelectStage={(s) => onNavigate("workspace")}
      />

      {/* 3 Metric Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-appBorder rounded-card p-4 shadow-card">
          <div className="flex items-center justify-between text-textMuted mb-2">
            <span className="text-xs font-medium">FalkorDB Facts</span>
            <BrainCircuit size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold font-heading text-appText">
            {facts.length}
          </div>
          <div className="text-[11px] text-success font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> Non-superseded truth nodes
          </div>
        </div>

        <div className="bg-surface border border-appBorder rounded-card p-4 shadow-card">
          <div className="flex items-center justify-between text-textMuted mb-2">
            <span className="text-xs font-medium">Episodic Turns</span>
            <Clock size={16} className="text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-appText">
            {episodes.length}
          </div>
          <div className="text-[11px] text-textMuted mt-1">
            Persistent session history
          </div>
        </div>

        <div className="bg-surface border border-appBorder rounded-card p-4 shadow-card">
          <div className="flex items-center justify-between text-textMuted mb-2">
            <span className="text-xs font-medium">Roadmap Tasks</span>
            <Target size={16} className="text-pink-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-appText">
            {tasks.length}
          </div>
          <div className="text-[11px] text-primary font-medium mt-1">
            Linked to agent decisions
          </div>
        </div>

        <div className="bg-surface border border-appBorder rounded-card p-4 shadow-card">
          <div className="flex items-center justify-between text-textMuted mb-2">
            <span className="text-xs font-medium">Validation Viability</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-heading text-appText">
            86 / 100
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            High WTP confirmed
          </div>
        </div>
      </div>

      {/* Grid: Next Best Actions & Open Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Best Actions */}
        <div className="bg-surface border border-appBorder rounded-card p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-sm text-appText flex items-center gap-2">
                <Sparkles size={14} className="text-primary" /> Next Best Actions
              </h3>
              <span className="text-[11px] text-textMuted">Suggested by Supervisor</span>
            </div>

            <div className="space-y-3">
              {NEXT_ACTIONS.map((action, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg border border-appBorder bg-surfaceAlt/40 hover:bg-surfaceAlt transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-appText">
                        {action.title}
                      </h4>
                      <AgentBadge agent={action.agent} size="sm" />
                    </div>
                    <p className="text-xs text-textMuted leading-relaxed mb-3">
                      {action.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate(action.tab)}
                    className="self-start text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
                  >
                    <span>{action.actionText}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Memory Activity */}
        <div className="bg-surface border border-appBorder rounded-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-sm text-appText flex items-center gap-2">
              <BrainCircuit size={14} className="text-primary" /> Recent Memory Activity
            </h3>
            <button
              onClick={() => onNavigate("memory")}
              className="text-xs text-primary font-semibold hover:underline"
            >
              View Full Graph
            </button>
          </div>

          <div className="space-y-2.5">
            {facts.slice(0, 5).map((fact, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-appBorder bg-white flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-semibold text-primary uppercase bg-primary-tint px-2 py-0.5 rounded-full">
                      {fact.key}
                    </span>
                    <span className="text-[10px] text-textMuted">
                      {fact.source_agent ? `Learned via ${fact.source_agent}` : "FalkorDB Fact"}
                    </span>
                  </div>
                  <p className="text-xs text-appText leading-relaxed">
                    {fact.text}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-success flex items-center gap-0.5 flex-shrink-0">
                  {Math.round((fact.confidence || 0.9) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

