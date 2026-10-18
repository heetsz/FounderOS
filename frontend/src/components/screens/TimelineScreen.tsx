"use client";

import React, { useState, useEffect } from "react";
import { Episode, Handoff, fetchEpisodes, fetchHandoffs } from "@/lib/api";
import { AgentBadge } from "@/components/AgentBadge";
import { GitCommit, Clock, ArrowRight, RefreshCw, Layers } from "lucide-react";

interface TimelineScreenProps {
  founderId: string;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({ founderId }) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [epData, hoData] = await Promise.all([
        fetchEpisodes(founderId),
        fetchHandoffs(founderId),
      ]);
      setEpisodes(epData);
      setHandoffs(hoData);
    } catch (e) {
      console.error("Failed to load timeline data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [founderId]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-appBorder">
        <div>
          <h2 className="text-lg font-bold font-heading text-appText flex items-center gap-2">
            <GitCommit size={18} className="text-primary" /> Episodic Handoff Timeline
          </h2>
          <p className="text-xs text-textMuted mt-0.5">
            Audit trail of specialist turns, handoffs, and persistent episodic memory in FalkorDB
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2 rounded-btn bg-surface hover:bg-surfaceAlt border border-appBorder text-textMuted"
          title="Refresh timeline"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin text-primary" : ""} />
        </button>
      </div>

      {/* Vertical Timeline Card */}
      <div className="bg-surface border border-appBorder rounded-card p-6 shadow-card relative">
        {/* Subtle connecting vertical line */}
        <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-appBorder" />

        <div className="space-y-8 relative">
          {episodes.map((ep, idx) => {
            // Find if this episode was involved in a handoff
            const matchingHandoff = handoffs.find(
              (h) => h.to_episode === ep.id || h.from_episode === ep.id
            );

            return (
              <div key={ep.id || idx} className="flex items-start gap-4 animate-fade-in">
                {/* Timeline node marker */}
                <div className="w-8 h-8 rounded-full bg-white border-2 border-primary flex items-center justify-center text-primary z-10 shadow-sm flex-shrink-0">
                  <Clock size={14} />
                </div>

                {/* Content Box */}
                <div className="flex-1 bg-surfaceAlt/40 border border-appBorder rounded-card p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <AgentBadge agent={ep.agent} size="sm" />
                    <span className="font-mono text-[11px] text-textMuted">
                      {new Date(ep.ts).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-appText leading-relaxed font-normal">
                    {ep.summary}
                  </p>

                  {/* Handoff chip if present */}
                  {matchingHandoff && (
                    <div className="mt-3 pt-2.5 border-t border-appBorder/80 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full">
                        Handoff
                      </span>
                      <span className="text-[11px] text-appText font-medium">
                        {matchingHandoff.from_agent} → {matchingHandoff.to_agent}:
                      </span>
                      <span className="text-[11px] text-textMuted italic truncate">
                        {matchingHandoff.reason}
                      </span>
                    </div>
                  )}

                  <div className="mt-2 text-[10px] font-mono text-textMuted">
                    Ref: {ep.id}
                  </div>
                </div>
              </div>
            );
          })}

          {episodes.length === 0 && (
            <div className="text-center py-12 text-xs text-textMuted">
              No episodes recorded yet. Start a conversation in the Agent Workspace!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

