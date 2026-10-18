"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck2,
  AlertTriangle
} from "lucide-react";
import confetti from "canvas-confetti";

interface DecisionsScreenProps {
  founderId: string;
  onNavigate: (screen: any) => void;
}

interface DecisionItem {
  id: string;
  title: string;
  status: "Approved" | "Under Review" | "Superseded";
  rationale: string;
  agent: string;
  timestamp: string;
  evidenceFacts: Array<{ key: string; text: string; confidence: number }>;
  tasksCount: number;
  risks: string[];
}

export const DecisionsScreen: React.FC<DecisionsScreenProps> = ({ founderId, onNavigate }) => {
  const [decisions, setDecisions] = useState<DecisionItem[]>([
    {
      id: "dec_1",
      title: "Validate repeat usage before scaling acquisition",
      status: "Approved",
      rationale: "Early customer interview telemetry indicated that premature paid acquisition leads to 80% churn if the initial onboarding drop-off is unaddressed.",
      agent: "Strategy Agent (Business Model)",
      timestamp: "Today at 9:30 AM",
      evidenceFacts: [
        { key: "onboarding_friction", text: "Users drop off after step 3 if setup exceeds 90 seconds.", confidence: 0.94 },
        { key: "icp_profile", text: "Target founders seek rapid self-serve customer interview synthesis.", confidence: 0.91 }
      ],
      tasksCount: 3,
      risks: ["Delaying paid marketing may reduce short-term lead volume."]
    },
    {
      id: "dec_2",
      title: "Deploy usage-based pricing tier at $49/mo starter",
      status: "Approved",
      rationale: "Replaces traditional heavy upfront contracts with frictionless entry tier to drive organic founder virality.",
      agent: "Strategy Agent (Business Model)",
      timestamp: "Yesterday",
      evidenceFacts: [
        { key: "pricing_wedge", text: "Usage-based tier starting at $49/mo provides lowest barrier to trial activation.", confidence: 0.92 }
      ],
      tasksCount: 2,
      risks: ["Requires self-serve stripe metering infrastructure."]
    },
    {
      id: "dec_3",
      title: "Build 3-step interactive onboarding prototype",
      status: "Approved",
      rationale: "Streamlines time-to-first-graph-insight to under 45 seconds.",
      agent: "Execution Agent (Launch Planner)",
      timestamp: "Yesterday",
      evidenceFacts: [
        { key: "onboarding_friction", text: "Users drop off after step 3 if setup exceeds 90 seconds.", confidence: 0.94 }
      ],
      tasksCount: 2,
      risks: ["May omit advanced enterprise configuration toggles on Day 1."]
    },
    {
      id: "dec_4",
      title: "Target US & European pre-seed accelerator cohorts for Alpha pilot",
      status: "Under Review",
      rationale: "Accelerators provide dense clusters of active early-stage founders facing customer discovery bottlenecks.",
      agent: "Research Agent (Market Scout)",
      timestamp: "2 days ago",
      evidenceFacts: [
        { key: "tam_market", text: "450k pre-seed/seed startups worldwide spending $3.2B on intelligence tools.", confidence: 0.88 }
      ],
      tasksCount: 1,
      risks: ["Application season cycles may introduce timing delays."]
    }
  ]);

  const [selectedDecision, setSelectedDecision] = useState<DecisionItem>(decisions[0]);

  const handleApprove = (id: string) => {
    setDecisions(prev =>
      prev.map(d => (d.id === id ? { ...d, status: "Approved" } : d))
    );
    confetti({ particleCount: 40, spread: 50 });
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-borderDark gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-warmAccent bg-warmAccent/10 px-2 py-0.5 rounded border border-warmAccent/20">
              Strategic Memory
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Strategic Decisions
          </h1>
          <p className="text-xs text-textSecondary mt-1">
            Formal strategic choices co-authored by Founder & Agents, anchored to FalkorDB facts and execution tasks.
          </p>
        </div>

        <button
          onClick={() => onNavigate("chat")}
          className="px-4 py-2 bg-gradient-to-r from-warmAccent to-amber-600 hover:from-amber-500 hover:to-amber-600 text-bgDark font-semibold text-xs rounded-lg transition shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Draft New Decision
        </button>
      </div>

      {/* Decisions Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Decisions List */}
        <div className="space-y-3 lg:col-span-1">
          <span className="text-xs font-mono uppercase text-textMuted tracking-wider font-semibold block px-1">
            Decisions ({decisions.length})
          </span>

          {decisions.map((d) => {
            const isSelected = selectedDecision.id === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDecision(d)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? "bg-elevatedDark border-warmAccent shadow-sm"
                    : "bg-panelDark border-borderDark hover:border-borderDark/80"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      d.status === "Approved"
                        ? "bg-executionGreen/20 text-executionGreen border border-executionGreen/30"
                        : "bg-warningAmber/20 text-warningAmber border border-warningAmber/30"
                    }`}
                  >
                    {d.status}
                  </span>
                  <span className="text-[10px] text-textMuted font-mono">{d.timestamp}</span>
                </div>

                <h3 className="text-xs font-bold text-textPrimary leading-snug">
                  {d.title}
                </h3>

                <p className="text-[11px] text-textSecondary line-clamp-2 mt-1.5 leading-relaxed">
                  {d.rationale}
                </p>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-borderDark/60 text-[10px] text-textMuted">
                  <span>{d.evidenceFacts.length} Facts</span>
                  <span>{d.tasksCount} Tasks</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Decision Detail Card */}
        <div className="lg:col-span-2 bg-panelDark border border-borderDark rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-borderDark gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                    selectedDecision.status === "Approved"
                      ? "bg-executionGreen/20 text-executionGreen border border-executionGreen/30"
                      : "bg-warningAmber/20 text-warningAmber border border-warningAmber/30"
                  }`}
                >
                  {selectedDecision.status}
                </span>
                <span className="text-xs text-textMuted font-mono">ID: {selectedDecision.id}</span>
              </div>
              <h2 className="text-lg font-bold text-textPrimary mt-1">
                {selectedDecision.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {selectedDecision.status !== "Approved" && (
                <button
                  onClick={() => handleApprove(selectedDecision.id)}
                  className="px-3 py-1.5 bg-executionGreen hover:bg-emerald-400 text-bgDark text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Decision
                </button>
              )}
              <button
                onClick={() => onNavigate("graph")}
                className="px-3 py-1.5 bg-elevatedDark hover:bg-borderDark text-textPrimary text-xs font-medium rounded-lg border border-borderDark transition flex items-center gap-1"
              >
                <GitBranch className="w-3.5 h-3.5 text-researchBlue" />
                Inspect Graph
              </button>
            </div>
          </div>

          {/* Rationale Section */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-textMuted font-semibold mb-2">
              Strategic Rationale
            </h3>
            <div className="bg-elevatedDark border-l-4 border-warmAccent p-4 rounded-r-xl text-xs text-textPrimary leading-relaxed">
              {selectedDecision.rationale}
            </div>
          </div>

          {/* Supported Facts */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-textMuted font-semibold mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-researchBlue" />
              Supported Facts (FalkorDB Citations)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDecision.evidenceFacts.map((fact, idx) => (
                <div key={idx} className="bg-elevatedDark/60 border border-borderDark rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-researchBlue font-mono font-semibold mb-1">
                    <span>{fact.key}</span>
                    <span>{Math.round(fact.confidence * 100)}% Conf</span>
                  </div>
                  <p className="text-[11px] text-textSecondary leading-snug">{fact.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          {selectedDecision.risks.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-textMuted font-semibold mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warningAmber" />
                Considered Strategic Risks
              </h3>
              <div className="bg-elevatedDark/40 border border-borderDark rounded-xl p-3 text-xs space-y-1">
                {selectedDecision.risks.map((r, i) => (
                  <div key={i} className="text-[11px] text-textSecondary flex items-start gap-2">
                    <span className="text-warningAmber">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Implemented Roadmap Tasks Link */}
          <div className="pt-4 border-t border-borderDark flex items-center justify-between text-xs text-textMuted">
            <span>Implements {selectedDecision.tasksCount} active roadmap execution tasks</span>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-warmAccent font-semibold hover:underline flex items-center gap-1"
            >
              View in Roadmap <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
