"use client";

import React from "react";
import { useAppStore, DashboardTab } from "@/store/useAppStore";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { activeTab, setActiveTab, isLoading, error } = useAppStore();

  const navItems: { id: DashboardTab; label: string; icon: string }[] = [
    { id: "all", label: "Full Dashboard", icon: "📑" },
    { id: "overview", label: "Financial Overview", icon: "📊" },
    { id: "matrix", label: "Menu Engineering", icon: "⭐" },
    { id: "profitability", label: "Dish Profitability", icon: "💰" },
    { id: "replay", label: "Recipe Replay", icon: "🔄" },
    { id: "explorer3d", label: "3D Explorer", icon: "🧊" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Restaurant Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-lg shadow-sm">
                OB
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold tracking-tight">Osteria Bella</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Live Demo
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Italian Cucina & Trattoria • Financial Analytics Cockpit
                </p>
              </div>
            </div>

            {/* Currency & Meta Info */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Currency: <strong className="text-neutral-900 dark:text-white">INR (₹)</strong></span>
              </div>
              <div className="hidden sm:flex items-center px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                <span>Dataset: <strong>Canonical 2025</strong></span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-t border-neutral-100 dark:border-neutral-800 overflow-x-auto py-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white rounded-full mb-4"></div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading canonical dataset and executing deterministic financial engine...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 my-6">
            <h3 className="text-sm font-semibold">Engine Initialization Error</h3>
            <p className="text-xs mt-1">{error}</p>
          </div>
        )}

        {!isLoading && !error && children}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Osteria Bella • Stage 3 2D Financial Dashboard</span>
          <span>Powered by Deterministic TypeScript Engine • Verified Vitest Math</span>
        </div>
      </footer>
    </div>
  );
}
