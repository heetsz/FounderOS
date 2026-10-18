"use client";

import React, { useState, useEffect } from "react";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodeDrawer } from "@/components/NodeDrawer";
import { GraphData, GraphNode, fetchGraph } from "@/lib/api";
import { Network, RefreshCw, Layers, ShieldCheck, GitBranch } from "lucide-react";

interface GraphScreenProps {
  founderId: string;
}

export const GraphScreen: React.FC<GraphScreenProps> = ({ founderId }) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadGraph = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGraph(founderId);
      if (data && data.nodes && data.nodes.length > 0) {
        setGraphData(data);
      } else {
        // Fallback demo graph data
        setGraphData({
          nodes: [
            { id: "founder", label: "Founder", title: "Arjun Mehta", color: "#8B5CF6", properties: { role: "Founder", stage: "Validation" } },
            { id: "startup", label: "Startup", title: "Parakh AI", color: "#3B82F6", properties: { idea: "AI Agent workspace with persistent FalkorDB memory", stage: "Validation" } },
            { id: "fact_1", label: "Fact", title: "Onboarding Drop-off", color: "#6366F1", properties: { key: "onboarding_friction", confidence: 0.94, text: "Users drop off after step 3 if setup exceeds 90s." } },
            { id: "fact_2", label: "Fact", title: "TAM $3.2B", color: "#6366F1", properties: { key: "tam_metric", confidence: 0.88, text: "450k pre-seed/seed startups worldwide." } },
            { id: "fact_3", label: "Fact", title: "Pricing Wedge", color: "#6366F1", properties: { key: "pricing_starter", confidence: 0.92, text: "Usage-based tier starting at $49/mo." } },
            { id: "dec_1", label: "Decision", title: "Test shorter onboarding", color: "#F59E0B", properties: { status: "Approved", rationale: "Validate repeat usage before scaling acquisition." } },
            { id: "dec_2", label: "Decision", title: "Usage-based pricing tier", color: "#F59E0B", properties: { status: "Approved", rationale: "Lower entry barrier to accelerate trial activation." } },
            { id: "task_1", label: "Task", title: "3-step onboarding prototype", color: "#EC4899", properties: { timeframe: "30_days", status: "todo", owner: "launch_planner" } },
            { id: "task_2", label: "Task", title: "Recruit 5 pilot founders", color: "#EC4899", properties: { timeframe: "30_days", status: "in_progress", owner: "validator" } },
            { id: "ep_1", label: "Episode", title: "Validation Episode #1", color: "#0EA5E9", properties: { agent: "validator", summary: "Extracted acute customer pain points." } }
          ],
          edges: [
            { source: "founder", target: "startup", label: "OWNS" },
            { source: "startup", target: "dec_1", label: "APPROVED_DECISION" },
            { source: "startup", target: "dec_2", label: "APPROVED_DECISION" },
            { source: "fact_1", target: "dec_1", label: "INFORMS" },
            { source: "fact_3", target: "dec_2", label: "INFORMS" },
            { source: "dec_1", target: "task_1", label: "IMPLEMENTS" },
            { source: "dec_1", target: "task_2", label: "IMPLEMENTS" },
            { source: "ep_1", target: "fact_1", label: "LEARNED" },
            { source: "ep_1", target: "fact_2", label: "LEARNED" }
          ]
        });
      }
    } catch (e) {
      console.error("Failed to load graph:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [founderId]);

  return (
    <div className="flex-1 flex flex-col h-full bg-bgDark relative overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-panelDark/80 border-b border-borderDark px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Network className="w-5 h-5 text-researchBlue" />
          <div>
            <h2 className="text-sm font-bold text-textPrimary leading-none">
              FalkorDB Knowledge Graph
            </h2>
            <p className="text-[11px] text-textMuted mt-1">
              Interactive memory graph: nodes, episodic links, facts, decisions, and tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-textMuted bg-elevatedDark px-3 py-1 rounded-lg border border-borderDark">
            <span>Nodes: <strong className="text-textPrimary">{graphData.nodes.length}</strong></span>
            <span>•</span>
            <span>Edges: <strong className="text-textPrimary">{graphData.edges.length}</strong></span>
          </div>

          <button
            onClick={loadGraph}
            disabled={isLoading}
            className="p-2 bg-elevatedDark hover:bg-panelDark border border-borderDark text-textSecondary hover:text-textPrimary rounded-lg transition"
            title="Reload Graph"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-warmAccent" : ""}`} />
          </button>
        </div>
      </div>

      {/* Graph Visual Canvas */}
      <div className="flex-1 relative">
        <GraphCanvas
          data={graphData}
          onSelectNode={(node) => setSelectedNode(node)}
          selectedNodeId={selectedNode?.id}
        />

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <NodeDrawer
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
};
