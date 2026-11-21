import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import {
  FirstTimeOnboardingModal,
  DemoModeBanner,
  GuideMenuPopover,
} from "./index";
import { useAppStore } from "@/store/useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";

describe("Stage 11: Onboarding & Demo Components", () => {
  const canonicalDataset = loadStoryDatasetFromDisk();

  beforeEach(() => {
    useAppStore.setState({
      dataset: canonicalDataset,
      demoDatasetBackup: canonicalDataset,
      datasetMode: "demo",
      isDemoMode: false,
      liveStateSnapshot: null,
      isTourOpen: false,
      currentTourStep: 0,
      isOnboardingModalOpen: false,
    });
  });

  describe("FirstTimeOnboardingModal", () => {
    it("does not render when isOnboardingModalOpen is false", () => {
      useAppStore.setState({ isOnboardingModalOpen: false });
      const html = renderToString(<FirstTimeOnboardingModal />);
      expect(html).toBe("");
    });

    it("renders welcome modal with 3 core pillars and action pathways when open", () => {
      useAppStore.setState({ isOnboardingModalOpen: true });
      const html = renderToString(<FirstTimeOnboardingModal />);

      expect(html).toContain("data-testid=\"first-time-onboarding-modal\"");
      expect(html).toContain("Welcome to CULINOMICS");
      expect(html).toContain("Historical Actuals");
      expect(html).toContain("Deterministic Forecast");
      expect(html).toContain("Menu Surgery");
      expect(html).toContain("Start Interactive Tour (12 Steps)");
      expect(html).toContain("Explore Demo Mode");
      expect(html).toContain("Direct to Cockpit");
    });
  });

  describe("DemoModeBanner", () => {
    it("does not render when isDemoMode is false", () => {
      useAppStore.setState({ isDemoMode: false });
      const html = renderToString(<DemoModeBanner />);
      expect(html).toBe("");
    });

    it("renders persistent sandbox banner with action buttons when isDemoMode is true", () => {
      useAppStore.setState({ isDemoMode: true });
      const html = renderToString(<DemoModeBanner />);

      expect(html).toContain("data-testid=\"demo-mode-banner\"");
      expect(html).toContain("Demo Sandbox Active");
      expect(html).toContain("CULINOMICS");
      expect(html).toContain("Reset Scenario");
      expect(html).toContain("Exit Demo");
    });
  });

  describe("GuideMenuPopover", () => {
    it("renders guide & tour header button", () => {
      const html = renderToString(<GuideMenuPopover />);
      expect(html).toContain("data-testid=\"guide-menu-button\"");
      expect(html).toContain("Guide &amp; Tour");
    });
  });

  describe("Interactive Handlers & Store Sync", () => {
    it("triggers demo mode entry and exit cleanly", async () => {
      expect(useAppStore.getState().isDemoMode).toBe(false);

      await useAppStore.getState().enterDemoMode();
      expect(useAppStore.getState().isDemoMode).toBe(true);

      await useAppStore.getState().exitDemoMode();
      expect(useAppStore.getState().isDemoMode).toBe(false);
    });

    it("triggers tour start and sets currentTourStep to 0", () => {
      expect(useAppStore.getState().isTourOpen).toBe(false);

      useAppStore.getState().startTour();
      expect(useAppStore.getState().isTourOpen).toBe(true);
      expect(useAppStore.getState().currentTourStep).toBe(0);
    });

    it("controls onboarding modal visibility state", () => {
      useAppStore.getState().setIsOnboardingModalOpen(true);
      expect(useAppStore.getState().isOnboardingModalOpen).toBe(true);

      useAppStore.getState().setIsOnboardingModalOpen(false);
      expect(useAppStore.getState().isOnboardingModalOpen).toBe(false);
    });
  });
});
