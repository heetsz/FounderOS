"use client";

import React, { useState } from "react";
import {
  Radar,
  ShieldAlert,
  AlertTriangle,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles
} from "lucide-react";

interface DriftRadarScreenProps {
  founderId: string;
  onNavigate: (screen: any) => void;
}

interface DriftAlert {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  newEvidence: string;
  priorDecision: string;
  detectionReason: string;
  confidence: number;
  affectedTasks: string[];
  timestamp: string;
  status: "active" | "reviewed" | "dismissed";
}

export const DriftRadarScreen: React.FC<DriftRadarScreenProps> = ({ founderId, onNavigate }) => {
  const [alerts, setAlerts] = useState<DriftAlert[]>([
    {
      id: "drift_1",
      severity: "high",
      title: "New telemetry weakens “Test shorter onboarding”",
      newEvidence: "Day 3 product telemetry across 15 beta founders shows that 42% skipped interactive tooltips, but retention was actually 12% higher for those who explored empty workspaces unguided.",
      priorDecision: "Decision: Mandate 3-step interactive onboarding prototype before user can create first project.",
      detectionReason: "Contradiction detected between Qualitative Interview #4 assumption ('founders need step-by-step guidance') and Empirical Telemetry Metric #12 ('unguided exploration had higher retention').",
      confidence: 0.89,
      affectedTasks: ["Build 3-step lightweight onboarding prototype", "Configure tooltip tours"],
      timestamp: "45 minutes ago",
      status: "active"
    },
    {
      id: "drift_2",
      severity: "medium",
      title: "Competitor price reduction affects $49/mo wedge defensibility",
      newEvidence: "Market Scout identified that rival platform launched a free starter tier for up to 3 team members.",
      priorDecision: "Decision: Usage-based pricing tier at $49/mo starter with zero free tier.",
      detectionReason: "External market intelligence indicates price pressure on pre-revenue seed founders.",
      confidence: 0.84,
      affectedTasks: ["Evaluate Pricing Unit Economics", "Stripe billing tier setup"],
      timestamp: "3 hours ago",
      status: "active"
    }
  ]);

  const [selectedAlert, setSelectedAlert] = useState<DriftAlert>(alerts[0]);

  const handleReview = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: "reviewed" } : a))
    );
    alert("Alert marked as Reviewed. Co-founder agent workspace primed with contradictory evidence context.");
  };

  const handleDismiss = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, status: "dismissed" } : a))
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-borderDark gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-dangerCoral bg-dangerCoral/10 px-2 py-0.5 rounded border border-dangerCoral/30 font-semibold flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 animate-spin-slow" />
              Decision Drift Radar
            </span>
            <span className="text-xs text-textMuted">• Continuous Graph Auditing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Drift & Contradiction Alerts
          </h1>
          <p className="text-xs text-textSecondary mt-1">
            FounderOS monitors graph evidence continuously. Approved decisions are NEVER silently changed — founders review contradictions here.
          </p>
        </div>

        <button
          onClick={() => onNavigate("chat")}
          className="px-4 py-2 bg-gradient-to-r from-warmAccent to-amber-600 hover:from-amber-500 hover:to-amber-600 text-bgDark font-semibold text-xs rounded-lg transition shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Resolve with Strategy Agent
        </button>
      </div>

      {/* Main Grid: Alerts list + Deep Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts List */}
        <div className="space-y-3 lg:col-span-1">
          <span className="text-xs font-mono uppercase text-textMuted tracking-wider font-semibold block px-1">
            Active Alerts ({alerts.filter(a => a.status === "active").length})
          </span>

          {alerts.map((alert) => {
            const isSelected = selectedAlert.id === alert.id;
            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? "bg-elevatedDark border-dangerCoral shadow-sm"
                    : "bg-panelDark border-borderDark hover:border-dangerCoral/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${
                      alert.severity === "high"
                        ? "bg-dangerCoral/20 text-dangerCoral border border-dangerCoral/40"
                        : "bg-warningAmber/20 text-warningAmber border border-warningAmber/40"
                    }`}
                  >
                    {alert.severity} Severity
                  </span>
                  <span className="text-[10px] text-textMuted font-mono">{alert.timestamp}</span>
                </div>

                <h3 className="text-xs font-bold text-textPrimary leading-snug">
                  {alert.title}
                </h3>

                <p className="text-[11px] text-textSecondary line-clamp-2 mt-1.5">
                  {alert.newEvidence}
                </p>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-borderDark/60 text-[10px] text-textMuted">
                  <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
                  <span className="capitalize text-warmAccent">{alert.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Alert Investigation Card */}
        <div className="lg:col-span-2 bg-panelDark border border-borderDark rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-borderDark gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                    selectedAlert.severity === "high"
                      ? "bg-dangerCoral/20 text-dangerCoral border border-dangerCoral/40"
                      : "bg-warningAmber/20 text-warningAmber border border-warningAmber/40"
                  }`}
                >
                  {selectedAlert.severity} Severity Drift
                </span>
                <span className="text-xs text-textMuted font-mono">ID: {selectedAlert.id}</span>
              </div>
              <h2 className="text-lg font-bold text-textPrimary mt-1">
                {selectedAlert.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReview(selectedAlert.id)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-warmAccent to-amber-600 hover:from-amber-500 hover:to-amber-600 text-bgDark text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Review & Update
              </button>
              <button
                onClick={() => handleDismiss(selectedAlert.id)}
                className="px-3 py-1.5 bg-elevatedDark hover:bg-borderDark text-textSecondary hover:text-textPrimary text-xs font-medium rounded-lg border border-borderDark transition flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                Dismiss
              </button>
            </div>
          </div>

          {/* New Evidence vs Prior Decision */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-dangerCoral/10 border border-dangerCoral/30 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase text-dangerCoral font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                New Incoming Evidence
              </span>
              <p className="text-xs text-textPrimary leading-relaxed">
                {selectedAlert.newEvidence}
              </p>
            </div>

            <div className="bg-elevatedDark border border-borderDark rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase text-strategyViolet font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Existing Approved Decision
              </span>
              <p className="text-xs text-textPrimary leading-relaxed">
                {selectedAlert.priorDecision}
              </p>
            </div>
          </div>

          {/* Contradiction Detection Rationale */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-textMuted font-semibold mb-2">
              Why Contradiction Was Flagged
            </h3>
            <div className="bg-elevatedDark p-4 rounded-xl border border-borderDark text-xs text-textSecondary leading-relaxed">
              {selectedAlert.detectionReason}
            </div>
          </div>

          {/* Affected Tasks */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-textMuted font-semibold mb-2">
              Affected Execution Roadmap Tasks
            </h3>
            <div className="space-y-2">
              {selectedAlert.affectedTasks.map((t, i) => (
                <div key={i} className="p-3 bg-elevatedDark/60 border border-borderDark rounded-xl text-xs flex items-center justify-between">
                  <span className="text-textPrimary font-medium">{t}</span>
                  <span className="text-[10px] font-mono text-warningAmber bg-warningAmber/10 px-2 py-0.5 rounded">
                    May need revision
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-borderDark flex items-center justify-between text-xs text-textMuted">
            <span>Detection Confidence: {Math.round(selectedAlert.confidence * 100)}%</span>
            <button
              onClick={() => onNavigate("chat")}
              className="text-warmAccent font-semibold hover:underline flex items-center gap-1"
            >
              Consult Strategy Agent on this conflict →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
