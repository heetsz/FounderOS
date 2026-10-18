"use client";

import React, { useState, useRef, useEffect } from "react";
import { Fact, streamChat } from "@/lib/api";
import { AgentBadge, AGENT_CONFIG } from "@/components/AgentBadge";
import { HandoffChip } from "@/components/HandoffChip";
import { MemoryCard } from "@/components/MemoryCard";
import { LocalTime } from "@/components/LocalTime";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Send, Sparkles, BrainCircuit, ArrowRight, CornerDownLeft, Square } from "lucide-react";

interface MessageItem {
  id: string;
  sender: "user" | "agent";
  agentName?: string;
  text: string;
  timestamp: number;
  routingAgent?: string;
  routingReason?: string;
  memoryFacts?: Fact[];
}

interface HandoffItem {
  id: string;
  fromAgent: string;
  toAgent: string;
  reason: string;
  timestamp: number;
}

interface WorkspaceScreenProps {
  founderId: string;
  facts: Fact[];
  onRefreshMemory: () => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  founderId,
  facts,
  onRefreshMemory,
}) => {
  const [messages, setMessages] = useState<(MessageItem | HandoffItem)[]>([
    {
      id: "init_1",
      sender: "agent",
      agentName: "validator",
      text: "Welcome back! I have loaded your FalkorDB knowledge graph. The primary care clinic pain and $199/mo pricing facts are active. What would you like to explore or validate next?",
      timestamp: Date.now() - 60000,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAgent, setActiveAgent] = useState("supervisor");
  const [memoryUsed, setMemoryUsed] = useState<Fact[]>(facts.slice(0, 4));
  const [memoryWritten, setMemoryWritten] = useState<Fact[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  // Sync memoryUsed when initial facts load
  useEffect(() => {
    if (facts.length > 0 && memoryUsed.length === 0) {
      setMemoryUsed(facts.slice(0, 4));
    }
  }, [facts, memoryUsed.length]);

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => () => streamAbortRef.current?.abort(), []);

  const AGENT_LIST = [
    { id: "supervisor", name: "Supervisor", desc: "Routes & coordinates" },
    { id: "validator", name: "Idea Validator", desc: "Problem, ICP, score" },
    { id: "market_scout", name: "Market Scout", desc: "TAM, competitors" },
    { id: "business_model", name: "Business Model", desc: "Pricing, economics" },
    { id: "brand_pitch", name: "Brand & Pitch", desc: "Deck, 1-pager" },
    { id: "launch_planner", name: "Launch Planner", desc: "30-60-90 roadmap" },
  ];

  const QUICK_PROMPTS = [
    "Validate our ICP and market urgency",
    "Identify top competitors and strategic wedge",
    "Formulate 3-tier pricing and unit economics",
    "Outline the 10-slide investor pitch deck",
    "Create 30-day launch roadmap tasks",
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isStreaming) return;

    setInputText("");
    const userMsgId = `usr_${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    const agentMsgId = `ag_${Date.now()}`;
    let currentAgentText = "";
    let currentAgentName = "supervisor";

    // Insert pending agent message
    setMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        sender: "agent",
        agentName: currentAgentName,
        text: "",
        timestamp: Date.now(),
      },
    ]);

    const controller = new AbortController();
    streamAbortRef.current = controller;
    await streamChat(founderId, textToSend, controller.signal, {
      onToken: (token, agent) => {
        currentAgentText += token;
        currentAgentName = agent;
        setActiveAgent(agent);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? { ...m, text: currentAgentText, agentName: agent }
              : m
          )
        );
      },
      onAgentChanged: (agent, reason) => {
        setActiveAgent(agent);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === agentMsgId
              ? { ...message, routingAgent: agent, routingReason: reason }
              : message,
          ),
        );
      },
      onHandoff: (fromAgent, toAgent, reason) => {
        const handoffItem: HandoffItem = {
          id: `ho_${Date.now()}`,
          fromAgent,
          toAgent,
          reason,
          timestamp: Date.now(),
        };
        // Insert handoff chip into messages
        setMessages((prev) => [...prev, handoffItem]);
      },
      onMemoryRead: (data) => {
        const graphFacts = Array.isArray(data.facts) ? data.facts : [];
        setMessages((prev) =>
          prev.map((message) =>
            message.id === agentMsgId ? { ...message, memoryFacts: graphFacts } : message,
          ),
        );
        if (data.facts && data.facts.length > 0) {
          setMemoryUsed(data.facts.slice(0, 5));
        }
      },
      onMemoryWritten: (data) => {
        if (data.new_facts && data.new_facts.length > 0) {
          setMemoryWritten((prev) => [...data.new_facts, ...prev]);
        }
        onRefreshMemory();
      },
      onDone: () => {
        setIsStreaming(false);
        streamAbortRef.current = null;
      },
      onError: (err) => {
        console.error("Chat streaming error:", err);
        const details = err instanceof Error ? err.message : String(err);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === agentMsgId
              ? {
                  ...message,
                  agentName: "supervisor",
                  text: `I couldn't complete that response. ${details}`,
                }
              : message,
          ),
        );
        setIsStreaming(false);
        streamAbortRef.current = null;
      },
    });
    if (streamAbortRef.current === controller) streamAbortRef.current = null;
  };

  const handleStopResponse = () => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsStreaming(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-56px)] bg-appBg">
      {/* Left Column: 220px Agent list with status dots */}
      <div className="w-[220px] bg-white border-r border-appBorder p-4 flex flex-col justify-between lg:flex select-none">
        <div>
          <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-3">
            Active Team
          </div>
          <div className="space-y-2">
            {AGENT_LIST.map((ag) => {
              const cfg = AGENT_CONFIG[ag.id] || { dot: "#475569" };
              const isActive = activeAgent === ag.id;
              return (
                <div
                  key={ag.id}
                  className={`p-2.5 rounded-card border transition-all ${
                    isActive
                      ? "border-primary bg-primary-tint/70 shadow-sm"
                      : "border-appBorder/70 bg-surface hover:bg-surfaceAlt"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isActive ? "animate-ping" : ""
                      }`}
                      style={{ backgroundColor: cfg.dot }}
                    />
                    <span className="text-xs font-semibold text-appText truncate">
                      {ag.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-textMuted mt-1 truncate">
                    {ag.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-surfaceAlt rounded-card border border-appBorder text-[11px] text-textMuted">
          <div className="font-semibold text-appText mb-1 flex items-center gap-1">
            <BrainCircuit size={12} className="text-primary" /> Multi-Hop Handoffs
          </div>
          Specialists automatically pass context when cross-domain reasoning is needed.
        </div>
      </div>

      {/* Center Column: Streaming Chat */}
      <div className="flex-1 flex flex-col bg-appBg min-w-0">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((item) => {
            if ("fromAgent" in item) {
              return (
                <HandoffChip
                  key={item.id}
                  fromAgent={item.fromAgent}
                  toAgent={item.toAgent}
                  reason={item.reason}
                />
              );
            }

            const isUser = item.sender === "user";
            return (
              <div
                key={item.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fade-in`}
              >
                {!isUser && item.agentName && (
                  <div className="mb-1.5 flex items-center gap-2">
                    <AgentBadge agent={item.agentName} size="sm" />
                    <span className="text-[10px] text-textMuted">
                      <LocalTime timestamp={item.timestamp} />
                    </span>
                  </div>
                )}

                {!isUser && item.routingReason && (
                  <div className="mb-2 max-w-2xl rounded-lg border border-primary/15 bg-primary-tint/50 px-3 py-2 text-[11px] leading-relaxed text-textMuted">
                    <span className="font-semibold text-primary">Supervisor decision:</span>{" "}
                    Routed to {item.routingAgent?.replaceAll("_", " ")} after loading this founder’s graph. {item.routingReason}
                  </div>
                )}

                <div
                  className={`max-w-2xl px-4 py-3 rounded-card text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-primary text-white rounded-br-none shadow-sm"
                      : "bg-surface border border-appBorder text-appText rounded-bl-none shadow-card"
                  }`}
                >
                  {item.text ? (
                    isUser ? item.text : <MarkdownContent content={item.text} />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-textMuted italic">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      Thinking with FalkorDB graph memory...
                    </span>
                  )}
                </div>
                {!isUser && item.text && item.memoryFacts && (
                  <details className="mt-2 max-w-2xl rounded-lg border border-sky-200 bg-sky-50/70 px-3 py-2 text-[11px] text-slate-700">
                    <summary className="cursor-pointer font-semibold text-sky-800">
                      Founder graph context ({item.memoryFacts.length} active facts sent to the agent)
                    </summary>
                    {item.memoryFacts.length > 0 ? (
                      <>
                        <p className="mt-1 text-slate-500">Showing up to five facts included in the agent’s graph context.</p>
                        <ul className="mt-2 space-y-2 border-t border-sky-200 pt-2">
                          {item.memoryFacts.slice(0, 5).map((fact) => (
                            <li key={`${fact.key}-${fact.updated_at ?? ""}`}>
                              <span className="font-mono font-semibold text-sky-900">{fact.key}</span>
                              <span className="text-slate-500"> · {fact.confidence ? `${Math.round(fact.confidence * 100)}% confidence` : "graph memory"}</span>
                              <div className="mt-0.5 leading-relaxed">{fact.text}</div>
                              {(fact.source_agent || fact.source_episode) && (
                                <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                                  {fact.source_agent ? `learned by ${fact.source_agent}` : "learned in graph"}
                                  {fact.source_episode ? ` · ${fact.source_episode}` : ""}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="mt-2 border-t border-sky-200 pt-2 leading-relaxed">
                        No prior facts were stored for this founder. The agent received the current request without historical graph facts.
                      </p>
                    )}
                  </details>
                )}
              </div>
            );
          })}
          <div ref={chatScrollRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-appBorder/50 bg-white/60">
          <span className="text-[11px] font-semibold text-textMuted flex items-center gap-1 flex-shrink-0">
            <Sparkles size={12} className="text-primary" /> Prompts:
          </span>
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qp)}
              disabled={isStreaming}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-surface border border-appBorder hover:border-primary/50 text-appText transition-colors flex-shrink-0"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-appBorder">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Idea Validator, Market Scout, Business Model, or Pitch agent..."
              disabled={isStreaming}
              className="flex-1 bg-surfaceAlt border border-appBorder rounded-card px-4 py-3 text-sm text-appText placeholder-textMuted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopResponse}
                aria-label="Stop response"
                title="Stop response"
                className="px-4 py-3 rounded-card bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-5 py-3 rounded-card bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <span>Send</span>
                <CornerDownLeft size={14} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Right Column: 340px Memory Panel (Demo Highlight) */}
      <div className="w-[340px] bg-white border-l border-appBorder p-4  flex-col justify-between  xl:flex overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-appBorder">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary-tint flex items-center justify-center text-primary">
                <BrainCircuit size={14} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xs text-appText leading-none">
                  FalkorDB Memory
                </h3>
                <span className="text-[10px] text-textMuted font-mono">
                  fos_{founderId}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Live
            </span>
          </div>

          {/* Section 1: Memory Written (Highlighted) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <Sparkles size={12} /> Memory Written ({memoryWritten.length})
              </span>
              <span className="text-[10px] text-textMuted font-mono">FalkorDB</span>
            </div>
            {memoryWritten.length === 0 ? (
              <div className="text-center py-4 px-3 bg-surfaceAlt/60 rounded-card border border-dashed border-appBorder text-[11px] text-textMuted">
                Facts extracted by the Curator during chat will animate here live.
              </div>
            ) : (
              <div className="space-y-2">
                {memoryWritten.map((fact, idx) => (
                  <MemoryCard key={`new_${idx}_${fact.key}`} fact={fact} isNew={true} />
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Memory Used */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted">
                Memory Used ({memoryUsed.length})
              </span>
              <span className="text-[10px] text-textMuted font-mono">Prior Session</span>
            </div>
            <div className="space-y-2">
              {memoryUsed.map((fact, idx) => (
                <MemoryCard key={`used_${idx}_${fact.key}`} fact={fact} isNew={false} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-appBorder text-[10px] text-textMuted text-center">
          Persisted across sessions • Superseded, not overwritten
        </div>
      </div>
    </div>
  );
};

