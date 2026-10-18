import React, { useState } from "react";
import { GraphNode } from "@/lib/api";
import { X, Calendar, Key, ShieldCheck, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";

interface NodeDrawerProps {
  node: GraphNode | null;
  onClose: () => void;
}

export const NodeDrawer: React.FC<NodeDrawerProps> = ({ node, onClose }) => {
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);

  if (!node) return null;

  const props = node.properties || {};

  return (
    <div className="w-80 bg-surface border-l border-appBorder shadow-popover h-full flex flex-col p-4 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-appBorder">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: node.color }}
          />
          <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">
            {node.label} Record
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-textMuted hover:text-appText p-1 rounded-md hover:bg-surfaceAlt"
        >
          <X size={16} />
        </button>
      </div>

      <div className="my-3">
        <h3 className="text-sm font-bold text-appText leading-snug font-heading">
          {node.title}
        </h3>
        {props.kind && (
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary-tint text-primary">
            {props.kind}
          </span>
        )}
      </div>

      {/* Main text if available */}
      {props.text && (
        <div className="bg-surfaceAlt/70 border border-appBorder/80 rounded-lg p-2.5 mb-3">
          <MarkdownContent content={String(props.text)} className="text-xs leading-relaxed" />
        </div>
      )}

      {/* Provenance Details */}
      <div className="space-y-3 text-xs">
        <div>
          <h4 className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Key size={12} /> Graph Identifiers
          </h4>
          <div className="bg-surfaceAlt p-2 rounded text-[11px] font-mono space-y-1 text-slate-700">
            <div>
              <span className="text-textMuted">ID:</span> {node.id}
            </div>
            {props.key && (
              <div>
                <span className="text-textMuted">Key:</span> {props.key}
              </div>
            )}
            {props.agent && (
              <div>
                <span className="text-textMuted">Agent:</span> {props.agent}
              </div>
            )}
          </div>
        </div>

        {props.confidence !== undefined && (
          <div>
            <h4 className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldCheck size={12} /> Confidence Score
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surfaceAlt h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.round(props.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-primary">
                {Math.round(props.confidence * 100)}%
              </span>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Tag size={12} /> Node Properties
          </h4>
          <div className="border border-appBorder rounded-lg divide-y divide-appBorder text-[11px]">
            {Object.entries(props).map(([k, v]) => {
              if (["text", "title", "name"].includes(k)) return null;
              if (k === "summary") {
                const summaryText = String(v);
                const expanded = expandedSummaryId === node.id;
                const shouldTruncate = summaryText.length > 140 && !expanded;
                return (
                  <div key={k} className="flex flex-col gap-1 p-1.5">
                    <span className="text-textMuted capitalize">{k.replace("_", " ")}</span>
                    <span className="text-appText leading-relaxed">
                      {shouldTruncate ? `${summaryText.slice(0, 140).trimEnd()}…` : summaryText}
                    </span>
                    {summaryText.length > 140 && (
                      <button
                        type="button"
                        onClick={() => setExpandedSummaryId(expanded ? null : node.id)}
                        className="self-start inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary-hover"
                        aria-expanded={expanded}
                      >
                        {expanded ? "Show less" : "Read more"}
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>
                );
              }
              return (
                <div key={k} className="flex justify-between p-1.5">
                  <span className="text-textMuted capitalize">{k.replace("_", " ")}</span>
                  <span className="font-mono text-appText truncate max-w-[140px]">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {props.updated_at && (
          <div className="pt-2 border-t border-appBorder flex items-center gap-1.5 text-[11px] text-textMuted">
            <Calendar size={12} />
            <span>
              Updated: {new Date(props.updated_at).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

