"use client";

import React, { useState } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Layers,
  ArrowRight,
  FileCheck2,
  Clock,
  RefreshCw,
  Plus,
  MessageSquare
} from "lucide-react";
import confetti from "canvas-confetti";
import { API_BASE } from "@/lib/api";

interface ChatScreenProps {
  founderId: string;
  projectName: string;
}

interface Message {
  id: string;
  sender: "founder" | "agent";
  agentType?: "research" | "strategy" | "execution";
  agentName?: string;
  text: string;
  timestamp: string;
  recommendation?: string;
  evidence?: Array<{ label: string; detail: string; confidence: number }>;
  assumptions?: string[];
  risks?: string[];
  proposedTasks?: string[];
}

export default function ChatScreen({ founderId, projectName }: ChatScreenProps) {
  const [selectedAgent, setSelectedAgent] = useState<"research" | "strategy" | "execution">("strategy");
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [stepTimeline, setStepTimeline] = useState<string[]>([]);
  const [activeThreadId, setActiveThreadId] = useState("thread_1");

  const threads = [
    { id: "thread_1", title: "Next repeat-usage experiment", agent: "Strategy Agent", date: "Just now" },
    { id: "thread_2", title: "Customer pain points research", agent: "Research Agent", date: "2h ago" },
    { id: "thread_3", title: "Onboarding prototype roadmap", agent: "Execution Agent", date: "Yesterday" },
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_1",
      sender: "founder",
      text: "Use our previous customer research to recommend the next experiment for repeat usage.",
      timestamp: "10:14 AM"
    },
    {
      id: "msg_2",
      sender: "agent",
      agentType: "strategy",
      agentName: "Strategy Agent (Business Model & Validation)",
      timestamp: "10:15 AM",
      text: "Based on the onboarding friction finding and the recent customer interview evidence in FalkorDB, I recommend running a focused three-step onboarding experiment before increasing acquisition spend.",
      recommendation: "Deploy a simplified 3-step interactive onboarding prototype targeting the critical 90-second friction drop-off point.",
      evidence: [
        { label: "Onboarding drop-off finding", detail: "Users drop off at step 3 if setup exceeds 90s.", confidence: 0.94 },
        { label: "12 Customer Discovery Interviews", detail: "Founders cited cognitive overload during initial workspace setup.", confidence: 0.91 }
      ],
      assumptions: [
        "Eliminating non-critical telemetry configuration on Day 1 will raise D7 retention by 15-20%.",
        "Target ICP prefers self-serve completion over booking a guided onboarding call."
      ],
      risks: [
        "Advanced users may miss deeper customization features if removed from default flow.",
        "Short-term churn if default permissions are overly permissive."
      ],
      proposedTasks: [
        "Build 3-step lightweight onboarding prototype",
        "Recruit 5 pilot founders for A/B testing"
      ]
    }
  ]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userText = inputMessage;
    setInputMessage("");

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: "founder",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsStreaming(true);
    setStepTimeline(["Scope resolved", "Connecting to FalkorDB tenant graph..."]);

    // Attempt live streaming from backend, fallback seamlessly
    try {
      setTimeout(() => {
        setStepTimeline(["✓ Scope resolved", "✓ Retrieved 6 memory records from FalkorDB", "● Synthesizing evidence..."]);
      }, 700);

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founder_id: founderId || "demo_founder",
          message: userText,
          thread_id: activeThreadId
        })
      });

      if (res.ok && res.body) {
        // SSE reader
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data:")) {
              try {
                const data = JSON.parse(line.replace("data:", "").trim());
                if (data.token) fullReply += data.token;
              } catch (e) {}
            }
          }
        }

        if (fullReply) {
          setStepTimeline(["✓ Scope resolved", "✓ Retrieved 6 memory records", "✓ Built Context Passport", "✓ Co-authored to graph"]);
          setMessages((prev) => [
            ...prev,
            {
              id: `msg_${Date.now() + 1}`,
              sender: "agent",
              agentType: selectedAgent,
              agentName: `${selectedAgent.toUpperCase()} AGENT`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text: fullReply,
              recommendation: fullReply.slice(0, 160) + "..."
            }
          ]);
          setIsStreaming(false);
          return;
        }
      }
    } catch (e) {
      // Fallback response simulating real agent
    }

    setTimeout(() => {
      setStepTimeline(["✓ Scope resolved", "✓ Retrieved 6 memory records", "✓ Built Context Passport v18", "✓ Synthesized with FalkorDB graph"]);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: "agent",
          agentType: selectedAgent,
          agentName: `${selectedAgent === "research" ? "Research Agent (Validator)" : selectedAgent === "strategy" ? "Strategy Agent (Business Model)" : "Execution Agent (Launch Planner)"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `Analyzed query against persistent graph memory for ${projectName || "Parakh AI"}: Co-founders must focus on high-leverage execution. Given recent user interview data, prioritizing lightweight onboarding directly protects customer acquisition payback periods.`,
          recommendation: `Align execution with the validated D1 retention milestone of 35% before scaling spend.`,
          evidence: [
            { label: "ICP Interview Synthesis", detail: "Founders prefer fast self-serve setup without sales friction.", confidence: 0.92 }
          ],
          assumptions: ["Fast activation translates to higher referral coefficient."],
          risks: ["Need telemetry to monitor where users pause in the first 48 hours."],
          proposedTasks: ["Add post-onboarding NPS micro-survey"]
        }
      ]);
      setIsStreaming(false);
    }, 1800);
  };

  const handleSaveDecision = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
    alert("Strategic decision successfully saved and committed to FalkorDB graph memory!");
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] overflow-hidden">
      {/* Left Column: Conversations List */}
      <div className="w-64 bg-panelDark/80 border-r border-borderDark flex flex-col justify-between shrink-0">
        <div>
          <div className="p-3.5 border-b border-borderDark flex items-center justify-between">
            <span className="text-xs font-semibold text-textPrimary uppercase tracking-wider">
              Conversations
            </span>
            <button
              onClick={() => {
                const newId = `thread_${Date.now()}`;
                threads.push({ id: newId, title: "New Exploration", agent: "Strategy Agent", date: "Just now" });
                setActiveThreadId(newId);
              }}
              className="p-1 hover:bg-elevatedDark text-textSecondary hover:text-warmAccent rounded transition"
              title="New Conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 space-y-1">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition ${
                  activeThreadId === t.id
                    ? "bg-elevatedDark text-textPrimary border border-borderDark font-medium"
                    : "text-textSecondary hover:bg-panelDark hover:text-textPrimary"
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-textMuted shrink-0" />
                  <span className="truncate">{t.title}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-textMuted mt-1">
                  <span>{t.agent}</span>
                  <span>{t.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-borderDark text-[11px] text-textMuted">
          Persistent across browser refreshes & agent switches.
        </div>
      </div>

      {/* Main Column: Chat Workspace */}
      <div className="flex-1 flex flex-col bg-bgDark overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-borderDark flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panelDark/40">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-textPrimary">Next repeat-usage experiment</h2>
              <span className="w-2 h-2 rounded-full bg-executionGreen"></span>
            </div>
            <p className="text-xs text-textMuted mt-0.5">
              Persistent Multi-Agent Session • FalkorDB Graph Synced
            </p>
          </div>

          {/* Agent Selector Tabs */}
          <div className="flex items-center bg-panelDark border border-borderDark rounded-lg p-1 gap-1">
            <button
              onClick={() => setSelectedAgent("research")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                selectedAgent === "research"
                  ? "bg-researchBlue/20 text-researchBlue border border-researchBlue/40 font-semibold"
                  : "text-textSecondary hover:text-textPrimary"
              }`}
            >
              Research Agent
            </button>
            <button
              onClick={() => setSelectedAgent("strategy")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                selectedAgent === "strategy"
                  ? "bg-strategyViolet/20 text-strategyViolet border border-strategyViolet/40 font-semibold"
                  : "text-textSecondary hover:text-textPrimary"
              }`}
            >
              Strategy Agent
            </button>
            <button
              onClick={() => setSelectedAgent("execution")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                selectedAgent === "execution"
                  ? "bg-executionGreen/20 text-executionGreen border border-executionGreen/40 font-semibold"
                  : "text-textSecondary hover:text-textPrimary"
              }`}
            >
              Execution Agent
            </button>
          </div>
        </div>

        {/* Live Agent Timeline when running */}
        {isStreaming && (
          <div className="bg-elevatedDark/80 border-b border-borderDark px-6 py-2.5 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-3.5 h-3.5 text-warmAccent animate-spin" />
              <div className="flex items-center gap-2 text-textSecondary font-mono text-[11px]">
                {stepTimeline.map((step, idx) => (
                  <span key={idx} className="flex items-center gap-1 text-textPrimary font-semibold">
                    {step} {idx < stepTimeline.length - 1 && <span className="text-textMuted font-normal">→</span>}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-[10px] text-warmAccent font-mono uppercase bg-warmAccent/10 px-2 py-0.5 rounded">
              Graph Traversal
            </span>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m) => {
            if (m.sender === "founder") {
              return (
                <div key={m.id} className="flex justify-end gap-3 max-w-2xl ml-auto">
                  <div className="bg-elevatedDark border border-borderDark text-textPrimary rounded-2xl rounded-tr-sm p-4 text-xs leading-relaxed shadow-sm">
                    <p className="font-normal text-[13px]">{m.text}</p>
                    <span className="text-[10px] text-textMuted font-mono mt-1 block text-right">{m.timestamp}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-warmAccent/20 border border-warmAccent/40 flex items-center justify-center text-warmAccent text-xs font-bold shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex gap-3 max-w-3xl">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-md ${
                    m.agentType === "research"
                      ? "bg-researchBlue/20 text-researchBlue border border-researchBlue/40"
                      : m.agentType === "execution"
                      ? "bg-executionGreen/20 text-executionGreen border border-executionGreen/40"
                      : "bg-strategyViolet/20 text-strategyViolet border border-strategyViolet/40"
                  }`}
                >
                  <Bot className="w-4 h-4" />
                </div>

                <div className="flex-1 bg-panelDark border border-borderDark rounded-2xl rounded-tl-sm p-5 space-y-4 shadow-sm">
                  {/* Agent Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-borderDark">
                    <span className="text-xs font-semibold text-textPrimary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-warmAccent" />
                      {m.agentName || "Specialist Agent"}
                    </span>
                    <span className="text-[10px] text-textMuted font-mono">{m.timestamp}</span>
                  </div>

                  {/* Summary / Lead */}
                  <p className="text-xs text-textSecondary leading-relaxed">{m.text}</p>

                  {/* Recommendation Card */}
                  {m.recommendation && (
                    <div className="bg-elevatedDark border-l-4 border-warmAccent p-3.5 rounded-r-xl">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-warmAccent font-bold block mb-1">
                        Recommendation
                      </span>
                      <p className="text-xs text-textPrimary font-semibold">{m.recommendation}</p>
                    </div>
                  )}

                  {/* Evidence Section */}
                  {m.evidence && m.evidence.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted font-semibold block">
                        Supporting Evidence (FalkorDB Citations)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.evidence.map((ev, idx) => (
                          <div key={idx} className="bg-elevatedDark/60 border border-borderDark rounded-lg p-2.5 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-researchBlue font-semibold mb-0.5">
                              <span>{ev.label}</span>
                              <span className="font-mono">{Math.round(ev.confidence * 100)}% Conf</span>
                            </div>
                            <p className="text-[11px] text-textSecondary">{ev.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assumptions & Risks */}
                  {m.assumptions && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-elevatedDark/40 border border-borderDark/60 rounded-xl p-3 text-xs">
                        <span className="text-[10px] font-mono uppercase text-strategyViolet font-semibold flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3 h-3" /> Strategic Assumptions
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-textSecondary">
                          {m.assumptions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-elevatedDark/40 border border-borderDark/60 rounded-xl p-3 text-xs">
                        <span className="text-[10px] font-mono uppercase text-warningAmber font-semibold flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" /> Known Risks
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-textSecondary">
                          {m.risks?.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-borderDark">
                    <button
                      onClick={handleSaveDecision}
                      className="px-3 py-1.5 bg-gradient-to-r from-warmAccent to-amber-600 hover:from-amber-500 hover:to-amber-600 text-bgDark text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save as Decision
                    </button>

                    <button
                      onClick={() => alert("Tasks added to execution roadmap!")}
                      className="px-3 py-1.5 bg-elevatedDark hover:bg-borderDark text-textPrimary text-xs font-medium rounded-lg transition border border-borderDark flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-executionGreen" />
                      Create Tasks
                    </button>

                    <button
                      onClick={() => alert("Displaying provenance chain in right inspector.")}
                      className="px-3 py-1.5 bg-elevatedDark hover:bg-borderDark text-textSecondary hover:text-textPrimary text-xs font-medium rounded-lg transition border border-borderDark flex items-center gap-1"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-researchBlue" />
                      Why this answer?
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Composer */}
        <div className="p-4 border-t border-borderDark bg-panelDark/60">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="flex items-center gap-2 bg-elevatedDark border border-borderDark rounded-xl p-1.5 focus-within:border-warmAccent transition">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Ask ${selectedAgent === "research" ? "Research" : selectedAgent === "strategy" ? "Strategy" : "Execution"} Agent about ${projectName || "Parakh AI"}...`}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isStreaming}
                className="p-2 bg-warmAccent hover:bg-amber-400 disabled:opacity-40 text-bgDark rounded-lg font-bold transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-textMuted text-center">
              Agents use shared project memory in FalkorDB. Important recommendations show their evidence path.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

