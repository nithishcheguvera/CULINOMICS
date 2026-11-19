import { VisualizationAction } from "@/ai/tools/actionSchema";
import { AppState } from "@/store/useAppStore";

/**
 * Pure dispatcher that applies verified VisualizationActions to the Zustand AppState.
 * Prevents arbitrary client execution by strictly dispatching allowlisted actions.
 */
export function dispatchVisualizationAction(
  action: VisualizationAction,
  store: Pick<
    AppState,
    "setActiveTab" | "setSelectedDishId" | "setThreeMode" | "setSelectedTimelineDate"
  >
): void {
  switch (action.actionType) {
    case "SET_ACTIVE_TAB":
      store.setActiveTab(action.tab);
      if (action.dishId) {
        store.setSelectedDishId(action.dishId);
      }
      break;

    case "SET_SELECTED_DISH":
      store.setSelectedDishId(action.dishId);
      break;

    case "SET_THREE_MODE":
      store.setActiveTab("explorer3d");
      store.setThreeMode(action.threeMode);
      if (action.dishId) {
        store.setSelectedDishId(action.dishId);
      }
      if (action.timelineDate) {
        store.setSelectedTimelineDate(action.timelineDate);
      }
      break;

    case "SET_TIMELINE_DATE":
      store.setSelectedTimelineDate(action.timelineDate);
      break;
  }
}
