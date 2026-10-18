"use client";

import React, { useState, useEffect } from "react";
import { GraphData, GraphNode, fetchGraph } from "@/lib/api";
import { GraphCanvas } from "@/components/GraphCanvas";
import { NodeDrawer } from "@/components/NodeDrawer";
import { BrainCircuit, RefreshCw, Layers, Sparkles } from "lucide-react";

interface MemoryExplorerScreenProps {
  founderId: string;
}

export const MemoryExplorerScreen: React.FC<MemoryExplorerScreenProps> = ({ founderId }) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "episodic" | "semantic" | "procedural">("all");

  const loadGraph = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGraph(founderId);
      setGraphData(data);
    } catch (e) {
      console.error("Failed to load graph:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [founderId]);

  // Tab filtering
  const filteredData = React.useMemo(() => {
    if (activeTab === "all") return graphData;
    let allowedLabels: string[] = [];
    if (activeTab === "episodic") allowedLabels = ["Episode", "Session", "Agent"];
    if (activeTab === "semantic") allowedLabels = ["Fact", "Decision", "Competitor", "Startup"];
    if (activeTab === "procedural") allowedLabels = ["Playbook", "Task", "Artifact"];

    const nodes = graphData.nodes.filter((n) => allowedLabels.includes(n.label));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graphData.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    return { nodes, edges };
  }, [graphData, activeTab]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] bg-appBg overflow-hidden">
      {/* Explorer Header */}
      <div className="h-14 px-6 border-b border-appBorder bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm text-appText leading-tight">
              FalkorDB Memory Explorer
            </h2>
            <p className="text-[11px] text-textMuted">
              Inspect knowledge nodes, episodic handoffs, and semantic facts for fos_{founderId}
            </p>
          </div>
        </div>

        {/* Memory Type Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-surfaceAlt p-1 rounded-lg border border-appBorder">
            {(["all", "semantic", "episodic", "procedural"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-semibold px-3 py-1 rounded capitalize transition-all ${
                  activeTab === tab
                    ? "bg-white text-primary shadow-xs"
                    : "text-textMuted hover:text-appText"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={loadGraph}
            disabled={isLoading}
            className="p-2 rounded-btn bg-surface hover:bg-surfaceAlt border border-appBorder text-textMuted hover:text-appText transition-colors"
            title="Refresh graph"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area + Node Drawer */}
      <div className="flex-1 flex overflow-hidden p-4 relative">
        <div className="flex-1 h-full">
          <GraphCanvas
            data={filteredData}
            onSelectNode={(node) => setSelectedNode(node)}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="ml-3 h-full">
            <NodeDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}
      </div>
    </div>
  );
};

