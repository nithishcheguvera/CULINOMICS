import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";

describe("Stage 11: Demo Mode & Interactive Guided Tour Store Slices", () => {
  const canonicalDataset = loadStoryDatasetFromDisk();

  beforeEach(() => {
    // Reset store to known state with canonical dataset
    useAppStore.setState({
      dataset: canonicalDataset,
      demoDatasetBackup: canonicalDataset,
      customDataset: null,
      datasetMode: "custom",
      selectedDishId: "wild-mushroom-risotto",
      selectedTimelineDate: "2025-01-01",
      activeTab: "matrix",
      isDemoMode: false,
      liveStateSnapshot: null,
      isTourOpen: false,
      currentTourStep: 0,
      isOnboardingModalOpen: false,
    });
  });

  it("captures an immutable liveStateSnapshot when entering demo mode", async () => {
    const store = useAppStore.getState();
    expect(store.isDemoMode).toBe(false);
    expect(store.liveStateSnapshot).toBeNull();

    await store.enterDemoMode();

    const updated = useAppStore.getState();
    expect(updated.isDemoMode).toBe(true);
    expect(updated.liveStateSnapshot).not.toBeNull();
    expect(updated.liveStateSnapshot?.datasetMode).toBe("custom");
    expect(updated.liveStateSnapshot?.selectedDishId).toBe("wild-mushroom-risotto");
    expect(updated.liveStateSnapshot?.activeTab).toBe("matrix");

    // In demo mode, datasetMode is set to demo and selectedDishId is truffle-tenderloin
    expect(updated.datasetMode).toBe("demo");
    expect(updated.selectedDishId).toBe("truffle-tenderloin");
    expect(updated.activeScenario).not.toBeNull();
  });

  it("restores the exact live state upon exiting demo mode", async () => {
    const store = useAppStore.getState();
    await store.enterDemoMode();

    // Perform an in-memory modification while in demo mode
    useAppStore.getState().setActiveTab("forecast");
    useAppStore.getState().setSelectedDishId("truffle-tenderloin");

    // Now exit demo mode
    await useAppStore.getState().exitDemoMode();

    const restored = useAppStore.getState();
    expect(restored.isDemoMode).toBe(false);
    expect(restored.liveStateSnapshot).toBeNull();
    expect(restored.datasetMode).toBe("custom");
    expect(restored.selectedDishId).toBe("wild-mushroom-risotto");
    expect(restored.activeTab).toBe("matrix");
  });

  it("handles exitDemoMode safely if called when liveStateSnapshot is null", async () => {
    useAppStore.setState({ isDemoMode: true, liveStateSnapshot: null });
    await useAppStore.getState().exitDemoMode();
    expect(useAppStore.getState().isDemoMode).toBe(false);
  });

  it("resets demo scenario to baseline values", async () => {
    await useAppStore.getState().enterDemoMode();
    const store = useAppStore.getState();

    // Modify scenario
    if (store.activeScenario) {
      store.updateScenario({
        ...store.activeScenario,
        targetSellingPrice: 9999,
      });
    }
    expect(useAppStore.getState().activeScenario?.targetSellingPrice).toBe(9999);

    // Reset demo scenario
    useAppStore.getState().resetDemoScenario();
    expect(useAppStore.getState().activeScenario?.targetSellingPrice).not.toBe(9999);
  });

  it("manages guided tour progression, steps, and bounds correctly", () => {
    const store = useAppStore.getState();
    expect(store.isTourOpen).toBe(false);
    expect(store.currentTourStep).toBe(0);

    // Start tour
    store.startTour();
    expect(useAppStore.getState().isTourOpen).toBe(true);
    expect(useAppStore.getState().currentTourStep).toBe(0);

    // Next step
    store.nextTourStep();
    expect(useAppStore.getState().currentTourStep).toBe(1);

    // Prev step
    store.prevTourStep();
    expect(useAppStore.getState().currentTourStep).toBe(0);

    // Prev step at 0 remains 0
    store.prevTourStep();
    expect(useAppStore.getState().currentTourStep).toBe(0);

    // Jump to specific step
    store.setTourStep(5);
    expect(useAppStore.getState().currentTourStep).toBe(5);

    // Skip tour closes it
    store.skipTour();
    expect(useAppStore.getState().isTourOpen).toBe(false);

    // Next step on last step (11) closes the tour
    store.setTourStep(11);
    store.nextTourStep();
    expect(useAppStore.getState().isTourOpen).toBe(false);
  });

  it("controls onboarding modal open/close state", () => {
    const store = useAppStore.getState();
    expect(store.isOnboardingModalOpen).toBe(false);

    store.setIsOnboardingModalOpen(true);
    expect(useAppStore.getState().isOnboardingModalOpen).toBe(true);

    store.setIsOnboardingModalOpen(false);
    expect(useAppStore.getState().isOnboardingModalOpen).toBe(false);
  });
});
