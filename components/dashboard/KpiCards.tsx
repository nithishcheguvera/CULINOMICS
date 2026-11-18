"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";

export function KpiCards() {
  const { kpis } = useAppStore();

  if (!kpis) return null;

  const cards = [
    {
      label: "Annual Revenue",
      value: formatINR(kpis.annualRevenue),
      subtitle: "12-month gross sales (96 records)",
      icon: (
        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badgeText: "Target Achieved",
      badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      label: "Annual Ingredient Cost",
      value: formatINR(kpis.annualIngredientCost),
      subtitle: "Direct food cost (COGS)",
      icon: (
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badgeText: "Inflation Impacted",
      badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      label: "Annual Gross Contribution",
      value: formatINR(kpis.annualGrossContribution),
      subtitle: "Gross profit before operating expenses",
      icon: (
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      badgeText: "Net Food Profit",
      badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      label: "Overall Contribution Margin",
      value: `${kpis.overallMarginPercentage.toFixed(2)}%`,
      subtitle: "Contribution / Revenue",
      icon: (
        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badgeText: "63.38% Avg",
      badgeClass: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    },
    {
      label: "Total Sales Volume",
      value: `${kpis.totalSalesVolume.toLocaleString("en-IN")} units`,
      subtitle: "1,920 units / month constant",
      icon: (
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      badgeText: "Stable Demand",
      badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    },
  ];

  return (
    <section aria-label="Key Financial Performance Indicators" className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {card.label}
                </span>
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {card.icon}
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {card.value}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="truncate pr-1">{card.subtitle}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${card.badgeClass}`}>
                {card.badgeText}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
