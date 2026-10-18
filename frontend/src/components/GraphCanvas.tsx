"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { GraphData, GraphNode, GraphEdge } from "@/lib/api";
import { ZoomIn, ZoomOut, RotateCcw, Filter, Search } from "lucide-react";

interface GraphCanvasProps {
  data: GraphData;
  onSelectNode?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
}

const COLOR_MAP: Record<string, string> = {
  Episode: "#0EA5E9",
  Fact: "#6366F1",
  Playbook: "#10B981",
  Decision: "#F59E0B",
  Task: "#EC4899",
  Artifact: "#64748B",
  Founder: "#8B5CF6",
  Startup: "#3B82F6",
  Agent: "#475569",
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  data,
  onSelectNode,
  selectedNodeId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);

  // Positioned nodes simulation state
  const [simNodes, setSimNodes] = useState<GraphNode[]>([]);

  // Unique labels for filtering
  const allLabels = useMemo(() => {
    const s = new Set<string>();
    data.nodes.forEach((n) => s.add(n.label));
    return Array.from(s);
  }, [data.nodes]);

  // Initialize simulation positions
  useEffect(() => {
    if (!data.nodes.length) {
      setSimNodes([]);
      return;
    }

    const width = containerRef.current?.clientWidth || 700;
    const height = containerRef.current?.clientHeight || 500;
    const cx = width / 2;
    const cy = height / 2;

    const initialized = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const radius = 120 + (i % 3) * 60;
      return {
        ...n,
        x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      };
    });

    // Run 40 physics relaxation steps
    for (let step = 0; step < 40; step++) {
      // Repulsion between nodes
      for (let i = 0; i < initialized.length; i++) {
        for (let j = i + 1; j < initialized.length; j++) {
          const dx = (initialized[j].x || 0) - (initialized[i].x || 0);
          const dy = (initialized[j].y || 0) - (initialized[i].y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / dist * 0.08;
            initialized[i].x! -= dx * force;
            initialized[i].y! -= dy * force;
            initialized[j].x! += dx * force;
            initialized[j].y! += dy * force;
          }
        }
      }

      // Spring attraction along edges
      data.edges.forEach((edge) => {
        const src = initialized.find((n) => n.id === edge.source);
        const tgt = initialized.find((n) => n.id === edge.target);
        if (src && tgt && src.x && src.y && tgt.x && tgt.y) {
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.02;
          src.x += (dx / dist) * force;
          src.y += (dy / dist) * force;
          tgt.x -= (dx / dist) * force;
          tgt.y -= (dy / dist) * force;
        }
      });

      // Gravity towards center
      initialized.forEach((n) => {
        if (n.x && n.y) {
          n.x += (cx - n.x) * 0.01;
          n.y += (cy - n.y) * 0.01;
        }
      });
    }

    setSimNodes(initialized);
  }, [data]);

  // Filtered nodes
  const visibleNodes = useMemo(() => {
    return simNodes.filter((n) => {
      if (activeFilters.length > 0 && !activeFilters.includes(n.label)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.label.toLowerCase().includes(q) ||
          JSON.stringify(n.properties).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [simNodes, activeFilters, searchQuery]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return data.edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [data.edges, visibleNodeIds]);

  // Render to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = containerRef.current?.clientWidth || 700;
    const height = containerRef.current?.clientHeight || 500;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    visibleEdges.forEach((edge) => {
      const src = simNodes.find((n) => n.id === edge.source);
      const tgt = simNodes.find((n) => n.id === edge.target);
      if (!src || !tgt || src.x === undefined || tgt.x === undefined) return;

      const isHighlight =
        selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(tgt.x, tgt.y!);
      ctx.strokeStyle = isHighlight ? "#4F46E5" : "#E2E8F0";
      ctx.lineWidth = isHighlight ? 2.5 : 1.2;
      ctx.stroke();

      // Draw edge label
      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y! + tgt.y!) / 2;
      ctx.font = "9px Inter, sans-serif";
      ctx.fillStyle = isHighlight ? "#4F46E5" : "#94A3B8";
      ctx.textAlign = "center";
      ctx.fillText(edge.label, midX, midY - 3);
    });

    // Draw nodes
    visibleNodes.forEach((node) => {
      if (node.x === undefined || node.y === undefined) return;
      const isSelected = selectedNodeId === node.id;
      const color = COLOR_MAP[node.label] || node.color || "#6366F1";
      const radius = isSelected ? 22 : 18;

      // Glow effect for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(79, 70, 229, 0.2)";
        ctx.fill();
      }

      // Outer circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = color;
      ctx.stroke();

      // Inner fill dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Node label
      ctx.font = "bold 10px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#0F172A";
      ctx.textAlign = "center";
      const labelText = node.title.length > 14 ? node.title.slice(0, 12) + "..." : node.title;
      ctx.fillText(labelText, node.x, node.y + radius + 13);

      // Node category badge
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#64748B";
      ctx.fillText(node.label, node.x, node.y + radius + 23);
    });

    ctx.restore();
  }, [visibleNodes, visibleEdges, pan, zoom, selectedNodeId]);

  // Click detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    const clicked = visibleNodes.find((n) => {
      if (n.x === undefined || n.y === undefined) return false;
      const dist = Math.sqrt((n.x - mouseX) ** 2 + (n.y - mouseY) ** 2);
      return dist <= 24;
    });

    onSelectNode?.(clicked || null);
  };

  const toggleFilter = (label: string) => {
    setActiveFilters((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] bg-white border border-appBorder rounded-card shadow-card overflow-hidden select-none"
    >
      {/* Top Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-sm p-1.5 rounded-lg border border-appBorder shadow-sm">
          <span className="text-xs font-semibold text-textMuted px-1 flex items-center gap-1">
            <Filter size={12} />
          </span>
          {allLabels.map((lbl) => {
            const active = activeFilters.includes(lbl);
            const color = COLOR_MAP[lbl] || "#475569";
            return (
              <button
                key={lbl}
                onClick={() => toggleFilter(lbl)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-surfaceAlt text-appText border-appBorder hover:bg-slate-200"
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                  style={{ backgroundColor: active ? "#FFF" : color }}
                />
                {lbl}
              </button>
            );
          })}
        </div>

        {/* Search & zoom controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-sm p-1 rounded-lg border border-appBorder shadow-sm">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-2 text-textMuted" />
            <input
              type="text"
              placeholder="Filter graph nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-6 pr-2 py-1 rounded bg-surfaceAlt border border-appBorder focus:outline-none focus:border-primary w-32 md:w-44"
            />
          </div>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-1 hover:bg-surfaceAlt rounded text-textMuted"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            className="p-1 hover:bg-surfaceAlt rounded text-textMuted"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1 hover:bg-surfaceAlt rounded text-textMuted"
            title="Reset view"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair"
      />

      {/* Empty State */}
      {visibleNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-textMuted text-xs">
          No graph nodes matching current filters.
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-3 text-[10px] text-textMuted bg-white/90 px-2.5 py-1 rounded-md border border-appBorder">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" /> Episode
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#6366F1]" /> Fact
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Decision
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Playbook
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#EC4899]" /> Task
        </span>
      </div>
    </div>
  );
};

