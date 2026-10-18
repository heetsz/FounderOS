"use client";

import React from "react";
import {
  Sparkles,
  CheckCircle2,
  ListTodo,
  BrainCircuit,
  Radar,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  UserCheck
} from "lucide-react";
import { TaskItem, FactItem } from "@/lib/api";

interface OverviewScreenProps {
  onNavigate: (screen: any) => void;
  tasks: TaskItem[];
  facts: FactItem[];
  projectName: string;
}

export default function OverviewScreen({
  onNavigate,
  tasks,
  facts,
  projectName
}: OverviewScreenProps) {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner & Greetings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-borderDark pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-warmAccent bg-warmAccent/10 px-2 py-0.5 rounded border border-warmAccent/20">
              Venture Overview
            </span>
            <span className="text-xs text-textMuted">• Live Session</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Good morning, Founder
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Here’s what changed in <span className="font-semibold text-textPrimary">{projectName || "Parakh AI"}</span> since your last session.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("chat")}
            className="px-4 py-2 bg-gradient-to-r from-warmAccent to-amber-600 hover:from-amber-500 hover:to-amber-600 text-bgDark font-semibold text-xs rounded-lg transition shadow-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask Co-Founder Agent
          </button>
          <button
            onClick={() => onNavigate("graph")}
            className="px-3.5 py-2 bg-elevatedDark hover:bg-panelDark border border-borderDark text-textPrimary text-xs font-medium rounded-lg transition flex items-center gap-1.5"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-researchBlue" />
            Inspect Graph
          </button>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigate("decisions")}
          className="bg-panelDark border border-borderDark hover:border-warmAccent/40 p-4 rounded-xl cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-textMuted text-xs mb-2">
            <span className="font-medium">Active Decisions</span>
            <CheckCircle2 className="w-4 h-4 text-warmAccent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-textPrimary font-mono">4</span>
            <span className="text-[11px] text-executionGreen font-medium flex items-center">
              +1 today
            </span>
          </div>
          <p className="text-[11px] text-textMuted mt-1">100% supported by graph facts</p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate("tasks")}
          className="bg-panelDark border border-borderDark hover:border-executionGreen/40 p-4 rounded-xl cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-textMuted text-xs mb-2">
            <span className="font-medium">Open Tasks</span>
            <ListTodo className="w-4 h-4 text-executionGreen" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-textPrimary font-mono">{tasks.length || 8}</span>
            <span className="text-[11px] text-textSecondary font-medium">3 in progress</span>
          </div>
          <p className="text-[11px] text-textMuted mt-1">30 / 60 / 90 day milestones</p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate("memory")}
          className="bg-panelDark border border-borderDark hover:border-researchBlue/40 p-4 rounded-xl cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-textMuted text-xs mb-2">
            <span className="font-medium">Memory Records</span>
            <BrainCircuit className="w-4 h-4 text-researchBlue" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-textPrimary font-mono">{facts.length * 6 || 42}</span>
            <span className="text-[11px] text-researchBlue font-medium">FalkorDB</span>
          </div>
          <p className="text-[11px] text-textMuted mt-1">Episodic & semantic graph nodes</p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate("drift")}
          className="bg-panelDark border border-dangerCoral/30 hover:border-dangerCoral/60 p-4 rounded-xl cursor-pointer transition shadow-sm bg-gradient-to-br from-panelDark to-dangerCoral/5"
        >
          <div className="flex items-center justify-between text-dangerCoral text-xs mb-2">
            <span className="font-semibold">Drift Alerts</span>
            <Radar className="w-4 h-4 text-dangerCoral animate-spin-slow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-dangerCoral font-mono">2</span>
            <span className="text-[11px] text-dangerCoral font-semibold">Action needed</span>
          </div>
          <p className="text-[11px] text-textMuted mt-1">Contradictory user evidence detected</p>
        </div>
      </div>

      {/* Main Grid: Current Focus Card + Drift Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Focus Highlight */}
        <div className="lg:col-span-2 bg-gradient-to-b from-panelDark to-elevatedDark border border-borderDark rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-warmAccent font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warmAccent animate-ping"></span>
              Current Strategic Focus
            </span>
            <span className="text-xs bg-executionGreen/15 text-executionGreen px-2 py-0.5 rounded-full font-medium border border-executionGreen/30">
              Approved
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-textPrimary leading-snug">
              Validate repeat usage before scaling acquisition
            </h3>
            <p className="text-xs text-textSecondary mt-1.5 leading-relaxed">
              Research Agent identified that onboarding drop-off reduces 14-day retention. Focus engineering on the 3-step prototype to secure product-market fit before allocating paid acquisition budgets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-borderDark text-xs text-textMuted">
            <div className="flex items-center gap-1.5">
              <span className="text-textPrimary font-semibold font-mono">3</span> Supported Facts
            </div>
            <div>•</div>
            <div className="flex items-center gap-1.5">
              <span className="text-textPrimary font-semibold font-mono">2</span> Active Tasks
            </div>
            <div>•</div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Updated 2 hrs ago
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => onNavigate("decisions")}
              className="text-xs font-semibold text-warmAccent hover:text-amber-300 flex items-center gap-1 transition"
            >
              View Decision Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("graph")}
              className="text-xs font-medium text-textSecondary hover:text-textPrimary flex items-center gap-1 transition"
            >
              Inspect Evidence Path <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Open Drift Alerts Widget */}
        <div className="bg-panelDark border border-borderDark rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-dangerCoral" />
                Open Drift Alerts
              </h3>
              <span className="text-[10px] bg-dangerCoral/15 text-dangerCoral px-2 py-0.5 rounded-full font-mono font-medium">
                2 Pending
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-elevatedDark border border-dangerCoral/30">
                <div className="flex justify-between items-center text-[10px] text-dangerCoral font-semibold mb-1">
                  <span>HIGH SEVERITY</span>
                  <span>45m ago</span>
                </div>
                <p className="text-xs text-textPrimary font-medium leading-snug">
                  New evidence may weaken “Test shorter onboarding”
                </p>
                <p className="text-[11px] text-textMuted mt-1">
                  Trial telemetry indicates 40% of founders skip guided tooltips entirely.
                </p>
                <button
                  onClick={() => onNavigate("drift")}
                  className="mt-2 text-[11px] font-semibold text-warmAccent hover:underline flex items-center gap-1"
                >
                  Review Conflict →
                </button>
              </div>

              <div className="p-3 rounded-xl bg-elevatedDark border border-warningAmber/30">
                <div className="flex justify-between items-center text-[10px] text-warningAmber font-semibold mb-1">
                  <span>MEDIUM SEVERITY</span>
                  <span>3h ago</span>
                </div>
                <p className="text-xs text-textPrimary font-medium leading-snug">
                  Competitor pricing shift detected in market
                </p>
                <p className="text-[11px] text-textMuted mt-1">
                  Competitor lowered entry seat pricing to $29/mo.
                </p>
                <button
                  onClick={() => onNavigate("drift")}
                  className="mt-2 text-[11px] font-semibold text-warmAccent hover:underline flex items-center gap-1"
                >
                  Review Impact →
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("drift")}
            className="w-full mt-4 py-2 bg-elevatedDark hover:bg-borderDark text-textSecondary hover:text-textPrimary text-xs rounded-lg transition font-medium border border-borderDark"
          >
            Open Decision Drift Radar
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Activity Timeline & Active Task Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Agent Activity Timeline */}
        <div className="bg-panelDark border border-borderDark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-textPrimary flex items-center gap-2">
              <Activity className="w-4 h-4 text-researchBlue" />
              Recent Agent Activity
            </h3>
            <span className="text-xs text-textMuted font-mono">FalkorDB Synced</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-researchBlue/20 text-researchBlue flex items-center justify-center shrink-0 text-xs font-bold border border-researchBlue/30">
                RA
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-textPrimary">Research Agent saved 3 findings</span>
                  <span className="text-[10px] text-textMuted font-mono">18m ago</span>
                </div>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  Extracted ICP preferences and onboarding drop-off metrics from interview transcripts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-strategyViolet/20 text-strategyViolet flex items-center justify-center shrink-0 text-xs font-bold border border-strategyViolet/30">
                SA
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-textPrimary">Strategy Agent drafted recommendation</span>
                  <span className="text-[10px] text-textMuted font-mono">1h ago</span>
                </div>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  Generated 3-step prototype proposal with unit economics payback period estimate.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-executionGreen/20 text-executionGreen flex items-center justify-center shrink-0 text-xs font-bold border border-executionGreen/30">
                EA
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-textPrimary">Execution Agent created 2 tasks</span>
                  <span className="text-[10px] text-textMuted font-mono">2h ago</span>
                </div>
                <p className="text-[11px] text-textSecondary mt-0.5">
                  Added &quot;Build 3-step lightweight prototype&quot; to 30-day Kanban roadmap.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Task Preview */}
        <div className="bg-panelDark border border-borderDark rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-textPrimary flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-executionGreen" />
                Active Roadmap Tasks
              </h3>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-xs font-medium text-warmAccent hover:underline"
              >
                View Kanban →
              </button>
            </div>

            <div className="space-y-2.5">
              {tasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-elevatedDark border border-borderDark rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        t.status === "done"
                          ? "bg-executionGreen"
                          : t.status === "in_progress"
                          ? "bg-warmAccent"
                          : "bg-textMuted"
                      }`}
                    ></span>
                    <span className="text-textPrimary font-medium truncate">{t.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize shrink-0 ${
                      t.status === "done"
                        ? "bg-executionGreen/20 text-executionGreen"
                        : t.status === "in_progress"
                        ? "bg-warmAccent/20 text-warmAccent"
                        : "bg-borderDark text-textMuted"
                    }`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-borderDark flex items-center justify-between text-xs text-textMuted">
            <span>Timeframe: 30 / 60 / 90 days</span>
            <span className="text-textSecondary font-mono">{tasks.filter(t => t.status === "done").length}/{tasks.length} Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

