"use client";

import React, { useState } from "react";
import { createFounder } from "@/lib/api";
import { X, Sparkles, ArrowRight, UserCheck } from "lucide-react";
import confetti from "canvas-confetti";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (founderId: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [startupName, setStartupName] = useState("");
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState("Validation");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !idea.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createFounder({
        name,
        startup_name: startupName || `${name}'s Startup`,
        idea,
        stage,
      });

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });

      onSuccess(res.founder_id);
      onClose();
    } catch (e) {
      console.error("Failed to create founder:", e);
      alert("Failed to initialize founder graph. Please check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface border border-appBorder rounded-card shadow-popover w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-textMuted hover:text-appText p-1 rounded-md"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-tint px-2.5 py-0.5 rounded-full">
              Founder Onboarding • Step {step} of 3
            </span>
          </div>
          <h2 className="text-xl font-bold font-heading text-appText">
            {step === 1 && "What's your name and startup?"}
            {step === 2 && "What are you building?"}
            {step === 3 && "What stage is your venture in?"}
          </h2>
          <p className="text-xs text-textMuted mt-1">
            FounderOS will provision your isolated FalkorDB graph memory instance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-appText mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full text-sm bg-surfaceAlt border border-appBorder rounded-btn px-3 py-2.5 text-appText focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-appText mb-1">
                  Startup / Project Name
                </label>
                <input
                  type="text"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  placeholder="e.g. Parakh AI"
                  className="w-full text-sm bg-surfaceAlt border border-appBorder rounded-btn px-3 py-2.5 text-appText focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-white text-xs font-semibold disabled:opacity-50"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-appText mb-1">
                  Idea in One or Two Lines
                </label>
                <textarea
                  required
                  rows={4}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. Autonomous workflow automation for boutique e-commerce brands with unified customer lifetime value memory..."
                  className="w-full text-sm bg-surfaceAlt border border-appBorder rounded-btn p-3 text-appText focus:outline-none focus:border-primary leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-textMuted hover:text-appText"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!idea.trim()}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-white text-xs font-semibold disabled:opacity-50"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-appText mb-2">
                  Select Current Stage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "Ideation", label: "Ideation", desc: "Exploring problem space" },
                    { id: "Validation", label: "Validation", desc: "Talking to customers" },
                    { id: "Prototype", label: "Prototype", desc: "Building alpha/MVP" },
                    { id: "Launch", label: "Launch Ready", desc: "Ready for distribution" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStage(st.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        stage === st.id
                          ? "border-primary bg-primary-tint/60 text-primary"
                          : "border-appBorder bg-white hover:bg-surfaceAlt text-appText"
                      }`}
                    >
                      <div className="text-xs font-semibold">{st.label}</div>
                      <div className="text-[10px] text-textMuted">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-textMuted hover:text-appText"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-btn bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  <UserCheck size={14} />
                  <span>{isSubmitting ? "Provisioning FalkorDB Graph..." : "Initialize Workspace"}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

