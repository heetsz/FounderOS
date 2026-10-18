"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, NavItem } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { WorkspaceScreen } from "@/components/screens/WorkspaceScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { MemoryExplorerScreen } from "@/components/screens/MemoryExplorerScreen";
import { TimelineScreen } from "@/components/screens/TimelineScreen";
import { ArtifactsScreen } from "@/components/screens/ArtifactsScreen";
import { TasksScreen } from "@/components/screens/TasksScreen";
import { SimulateScreen } from "@/components/screens/SimulateScreen";
import { OnboardingModal } from "@/components/OnboardingModal";
import {
  FounderInfo,
  Fact,
  Task,
  Episode,
  fetchFounderInfo,
  fetchFacts,
  fetchTasks,
  fetchEpisodes,
  seedDemoFounder,
} from "@/lib/api";

export default function Home() {
  const [founderId, setFounderId] = useState("demo_founder");
  const [currentTab, setCurrentTab] = useState<NavItem>("workspace");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [founderInfo, setFounderInfo] = useState<FounderInfo | null>(null);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  const loadTenantData = async (fid: string) => {
    setIsLoading(true);
    try {
      const [fInfo, fFacts, fTasks, fEpisodes] = await Promise.all([
        fetchFounderInfo(fid),
        fetchFacts(fid),
        fetchTasks(fid),
        fetchEpisodes(fid),
      ]);
      setFounderInfo(fInfo);
      setFacts(fFacts);
      setTasks(fTasks);
      setEpisodes(fEpisodes);
    } catch (e) {
      console.warn("Failed to load tenant data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData(founderId);
  }, [founderId]);

  const handleSeedDemo = async () => {
    setIsLoading(true);
    try {
      await seedDemoFounder();
      setFounderId("demo_founder");
      await loadTenantData("demo_founder");
    } catch (e) {
      console.error("Demo reset failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFounderCreated = (newId: string) => {
    setFounderId(newId);
    setCurrentTab("workspace");
    loadTenantData(newId);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-appBg text-appText font-body">
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        founderId={founderId}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          founderInfo={founderInfo}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onSeedDemo={handleSeedDemo}
          isLoading={isLoading}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {currentTab === "workspace" && (
            <WorkspaceScreen
              founderId={founderId}
              facts={facts}
              onRefreshMemory={() => loadTenantData(founderId)}
            />
          )}
          {currentTab === "dashboard" && (
            <DashboardScreen
              founderInfo={founderInfo}
              facts={facts}
              tasks={tasks}
              episodes={episodes}
              onNavigate={(tab) => setCurrentTab(tab as NavItem)}
            />
          )}
          {currentTab === "memory" && (
            <MemoryExplorerScreen founderId={founderId} />
          )}
          {currentTab === "timeline" && (
            <TimelineScreen founderId={founderId} />
          )}
          {currentTab === "artifacts" && (
            <ArtifactsScreen founderId={founderId} />
          )}
          {currentTab === "tasks" && (
            <TasksScreen founderId={founderId} />
          )}
          {currentTab === "simulate" && (
            <SimulateScreen />
          )}
        </main>
      </div>

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={handleFounderCreated}
      />
    </div>
  );
}
