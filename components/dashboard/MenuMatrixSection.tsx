"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory, MenuEngineeringDish } from "@/engine";

export function MenuMatrixSection() {
  const { menuEngineering, setSelectedDishId, setActiveTab } = useAppStore();

  if (!menuEngineering) return null;

  const { popularityThreshold, profitabilityThreshold, dishes } = menuEngineering;

  const handleDishClick = (dishId: string) => {
    setSelectedDishId(dishId);
    setActiveTab("replay");
  };

  const getDishesByCategory = (cat: MenuEngineeringCategory): MenuEngineeringDish[] => {
    return dishes.filter((d) => d.category === cat);
  };

  const quadrants = [
    {
      category: "STAR" as MenuEngineeringCategory,
      title: "Stars",
      subtitle: "High Popularity • High Profitability",
      description: "Core cash generators and guest favorites. Protect recipe quality and maintain high standards.",
      icon: "⭐",
      headerBg: "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      dishes: getDishesByCategory("STAR"),
      actionLabel: "Protect Quality & Highlight",
    },
    {
      category: "PLOWHORSE" as MenuEngineeringCategory,
      title: "Plowhorses",
      subtitle: "High Popularity • Low Profitability",
      description: "High-volume crowd pleasers with compressed margins. Re-engineer recipe portions or nudge prices up.",
      icon: "🐎",
      headerBg: "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      dishes: getDishesByCategory("PLOWHORSE"),
      actionLabel: "Re-engineer Cost / Portion",
    },
    {
      category: "PUZZLE" as MenuEngineeringCategory,
      title: "Puzzles",
      subtitle: "Low Popularity • High Profitability",
      description: "High margin gems that under-sell. Train staff to recommend, reposition on menu, and run promotions.",
      icon: "🧩",
      headerBg: "bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
      dishes: getDishesByCategory("PUZZLE"),
      actionLabel: "Promote & Upsell",
    },
    {
      category: "DOG" as MenuEngineeringCategory,
      title: "Dogs",
      subtitle: "Low Popularity • Low Profitability",
      description: "Low demand and poor margins. Seriously consider replacing, reformulating, or phasing out.",
      icon: "🐕",
      headerBg: "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
      dishes: getDishesByCategory("DOG"),
      actionLabel: "Reformulate or Cut",
    },
  ];

  return (
    <section aria-label="Menu Engineering Matrix Quadrants" className="space-y-6">
      {/* Header and Threshold Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Menu Engineering Matrix (Boston Consulting Group Model)
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Programmatic classification of all 8 dishes into 4 strategic quadrants based on deterministic thresholds
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[11px] block font-medium text-neutral-500 dark:text-neutral-400">Popularity Benchmark</span>
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {popularityThreshold.toFixed(1)} units / mo
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[11px] block font-medium text-neutral-500 dark:text-neutral-400">Profitability Benchmark</span>
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {formatINR(profitabilityThreshold, { showDecimals: true })} / serving
            </span>
          </div>
        </div>
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quadrants.map((q) => (
          <div
            key={q.category}
            className="flex flex-col rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
          >
            {/* Quadrant Header */}
            <div className={`p-4 border-b ${q.headerBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{q.icon}</span>
                  <div>
                    <h3 className="font-bold text-base leading-tight">{q.title}</h3>
                    <span className="text-xs opacity-80">{q.subtitle}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${q.badgeColor}`}>
                  {q.dishes.length} {q.dishes.length === 1 ? "dish" : "dishes"}
                </span>
              </div>
              <p className="text-xs mt-2 opacity-90 leading-relaxed">{q.description}</p>
            </div>

            {/* Dishes list */}
            <div className="p-4 flex-1 space-y-3">
              {q.dishes.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4 text-center">No dishes in this quadrant</p>
              ) : (
                q.dishes.map((dish) => (
                  <div
                    key={dish.dishId}
                    onClick={() => handleDishClick(dish.dishId)}
                    className="group p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {dish.dishName}
                        </span>
                        <span className="text-[10px] text-neutral-400 group-hover:inline-block hidden">
                          Click for Replay →
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        <span>
                          Sales: <strong className="text-neutral-700 dark:text-neutral-300">{dish.averageMonthlyVolume}</strong>/mo
                        </span>
                        <span>•</span>
                        <span>
                          Contrib: <strong className="text-neutral-700 dark:text-neutral-300">{formatINR(dish.averageContributionMargin, { showDecimals: true })}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                        {q.actionLabel}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDishId(dish.dishId);
                          setActiveTab("simulator");
                        }}
                        className="text-[11px] font-medium px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                        title="Simulate price, cost, and volume in Menu Surgery"
                      >
                        Simulate 🔬
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
