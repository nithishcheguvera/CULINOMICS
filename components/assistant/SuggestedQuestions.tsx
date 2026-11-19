"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

export function SuggestedQuestions({ onSelectQuestion }: SuggestedQuestionsProps) {
  const { selectedDishId, dishProfitability } = useAppStore();

  const activeDish = dishProfitability.find((d) => d.dishId === selectedDishId);
  const dishName = activeDish ? activeDish.dishName : "Truffle Butter Tenderloin Steak";

  const questions = [
    "How is the restaurant performing overall?",
    `Explain the margin erosion for ${dishName}`,
    "Which ingredients have the highest inflation rate?",
    "Show me the Menu Engineering Stars and Dogs",
    `Simulate a +15% price increase on ${dishName}`,
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z" />
        </svg>
        <span>Suggested Explorations</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, idx) => (
          <button
            key={idx}
            data-testid={`suggested-question-${idx}`}
            onClick={() => onSelectQuestion(q)}
            className="text-left px-2.5 py-1.5 rounded-md text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
