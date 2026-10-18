import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        appBg: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceAlt: "#F1F5F9",
        appBorder: "#E2E8F0",
        appText: "#0F172A",
        textMuted: "#64748B",
        primary: {
          DEFAULT: "#4F46E5",
          tint: "#EEF2FF",
          hover: "#4338CA",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        agent: {
          supervisor: "#475569",
          validator: "#6366F1",
          market: "#0EA5E9",
          model: "#10B981",
          brand: "#F59E0B",
          planner: "#EC4899",
        },
        node: {
          Episode: "#0EA5E9",
          Fact: "#6366F1",
          Playbook: "#10B981",
          Decision: "#F59E0B",
          Task: "#EC4899",
          Artifact: "#64748B",
          Founder: "#8B5CF6",
          Startup: "#3B82F6",
        }
      },
      fontFamily: {
        heading: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06)",
        popover: "0 8px 24px rgba(15,23,42,0.08)",
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
      }
    },
  },
  plugins: [],
};

export default config;

