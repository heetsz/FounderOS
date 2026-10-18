"use client";

import React, { useState, useEffect } from "react";
import { Artifact, fetchArtifacts } from "@/lib/api";
import { FileText, Copy, Check, Download, Layers, Sparkles } from "lucide-react";

interface ArtifactsScreenProps {
  founderId: string;
}

export const ArtifactsScreen: React.FC<ArtifactsScreenProps> = ({ founderId }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchArtifacts(founderId).then((data) => {
      // Default placeholder templates if none in db yet
      if (data.length === 0) {
        const defaults: Artifact[] = [
          {
            id: "art_lean_canvas",
            type: "lean_canvas",
            title: "Lean Canvas Architecture",
            version: 1,
            content: `### Lean Canvas: HealthSync AI\n\n**1. Problem:**\n- Doctors spend 2.5 hours nightly completing SOAP notes.\n- High burnout rates among independent primary care physicians.\n\n**2. Customer Segments:**\n- Independent clinics (2-10 physicians) with high patient volume.\n\n**3. Unique Value Proposition:**\n- Autonomous clinical copilot connecting ambient transcription directly to billing codes.\n\n**4. Solution:**\n- Real-time diagnostic documentation with EHR auto-sync.\n\n**5. Revenue Streams:**\n- $199/clinician/month SaaS tier with annual upfront option.\n\n**6. Cost Structure:**\n- LLM token inference & FalkorDB managed hosting.\n\n**7. Key Metrics:**\n- Daily active clinicians, documentation minutes saved per patient.`,
          },
          {
            id: "art_pitch_deck",
            type: "pitch_deck",
            title: "10-Slide Investor Deck Blueprint",
            version: 1,
            content: `### 10-Slide Investor Deck Outline\n\n1. **Title:** HealthSync AI — Autonomous Clinical Operations with Persistent Memory\n2. **The Problem:** 63% of primary care doctors report severe documentation fatigue.\n3. **The Solution:** Ambient listening that translates doctor-patient dialogue into verified medical records.\n4. **Market Size:** $14.2B US Ambulatory Health IT TAM ($1.8B SOM in independent clinics).\n5. **Product:** FalkorDB graph-backed memory agent team coordinating triage to coding.\n6. **Business Model:** $199/month/doctor SaaS subscription.\n7. **Traction:** 5 pilot clinics committed for 30-day trial.\n8. **Competitive Advantage:** Persistent graph memory prevents context loss across patient encounters.\n9. **Team:** Veteran healthcare operators & AI engineers.\n10. **The Ask:** Raising $750k Pre-Seed.`,
          },
          {
            id: "art_roadmap",
            type: "roadmap",
            title: "30 / 60 / 90-Day Execution Roadmap",
            version: 1,
            content: `### 30-60-90 Day Execution Roadmap\n\n**First 30 Days (Validation & Alpha):**\n- Finalize HIPAA BAA compliance contracts.\n- Conduct 10 primary care physician interviews.\n- Ship prototype ambient note generator.\n\n**60 Days (Beta & Iteration):**\n- Roll out closed beta with first 3 independent clinics.\n- Measure time saved per encounter (target: >45% reduction).\n- Refine billing ICD-10 recommendation accuracy.\n\n**90 Days (Commercial Launch):**\n- Open public registration.\n- Achieve first $5k MRR.\n- Launch Product Hunt & medical newsletter sponsorship.`,
          },
        ];
        setArtifacts(defaults);
        setSelectedArtifact(defaults[0]);
      } else {
        setArtifacts(data);
        setSelectedArtifact(data[0]);
      }
    });
  }, [founderId]);

  const handleCopy = () => {
    if (!selectedArtifact) return;
    navigator.clipboard.writeText(selectedArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedArtifact) return;
    const blob = new Blob([selectedArtifact.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedArtifact.title.toLowerCase().replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-56px)] bg-appBg">
      {/* Left List of Artifacts */}
      <div className="w-80 bg-white border-r border-appBorder p-4 flex flex-col justify-between">
        <div>
          <h2 className="font-heading font-bold text-sm text-appText mb-1 flex items-center gap-1.5">
            <FileText size={16} className="text-primary" /> Generated Artifacts
          </h2>
          <p className="text-[11px] text-textMuted mb-4">
            Living strategic documents synthesized by FounderOS agents
          </p>

          <div className="space-y-2">
            {artifacts.map((art) => {
              const isSelected = selectedArtifact?.id === art.id;
              return (
                <button
                  key={art.id}
                  onClick={() => setSelectedArtifact(art)}
                  className={`w-full text-left p-3 rounded-card border transition-all ${
                    isSelected
                      ? "border-primary bg-primary-tint/60 shadow-sm"
                      : "border-appBorder bg-surface hover:bg-surfaceAlt"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full">
                      v{art.version}
                    </span>
                    <span className="text-[10px] text-textMuted uppercase font-mono">
                      {art.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-appText truncate">
                    {art.title}
                  </h4>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-surfaceAlt rounded-card border border-appBorder text-[11px] text-textMuted">
          Artifacts evolve automatically as you chat and validate assumptions.
        </div>
      </div>

      {/* Main Document Viewer */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-appBg">
        {selectedArtifact ? (
          <div className="max-w-3xl mx-auto bg-surface border border-appBorder rounded-card p-6 md:p-8 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-appBorder mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-tint px-2.5 py-0.5 rounded-full">
                  Version {selectedArtifact.version}
                </span>
                <h3 className="text-lg font-bold font-heading text-appText mt-1">
                  {selectedArtifact.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-surfaceAlt hover:bg-slate-200 text-appText text-xs font-medium border border-appBorder transition-colors"
                >
                  {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Download size={13} />
                  <span>Export .md</span>
                </button>
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-appText leading-relaxed whitespace-pre-wrap font-sans text-xs md:text-sm">
              {selectedArtifact.content}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-textMuted">
            Select an artifact on the left to preview.
          </div>
        )}
      </div>
    </div>
  );
};

