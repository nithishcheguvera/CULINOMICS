import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { GuidedTour } from "./GuidedTour";
import { useAppStore } from "@/store/useAppStore";
import { TOUR_STEPS } from "./tourSteps";

describe("Stage 11: GuidedTour Component", () => {
  beforeEach(() => {
    useAppStore.setState({
      isTourOpen: false,
      currentTourStep: 0,
      activeTab: "all",
      selectedDishId: "truffle-tenderloin",
      threeMode: "profitability-landscape",
    });
  });

  it("does not render when isTourOpen is false", () => {
    const html = renderToString(<GuidedTour forceMount />);
    expect(html).toBe("");
  });

  it("renders overlay and first step when isTourOpen is true", () => {
    useAppStore.setState({ isTourOpen: true, currentTourStep: 0 });
    const html = renderToString(<GuidedTour forceMount />);

    expect(html).toContain("data-testid=\"guided-tour-overlay\"");
    expect(html).toContain("Step 1 of 12");
    expect(html).toContain(TOUR_STEPS[0].title);
    expect(html).toContain("Welcome to CULINOMICS");
  });

  it("renders step 2 navigation details when currentTourStep is 1", () => {
    useAppStore.setState({ isTourOpen: true, currentTourStep: 1 });
    const html = renderToString(<GuidedTour forceMount />);

    expect(html).toContain("Step 2 of 12");
    expect(html).toContain(TOUR_STEPS[1].title);
    expect(html).toContain("Cockpit Navigation Hub");
  });

  it("renders final step 12 with Finish Tour action button", () => {
    useAppStore.setState({ isTourOpen: true, currentTourStep: 11 });
    const html = renderToString(<GuidedTour forceMount />);

    expect(html).toContain("Step 12 of 12");
    expect(html).toContain("Executive Reports &amp; Exports");
    expect(html).toContain("Finish Tour");
  });

  it("updates store state when nextTourStep, prevTourStep, and skipTour are invoked", () => {
    useAppStore.setState({ isTourOpen: true, currentTourStep: 0 });

    useAppStore.getState().nextTourStep();
    expect(useAppStore.getState().currentTourStep).toBe(1);

    useAppStore.getState().prevTourStep();
    expect(useAppStore.getState().currentTourStep).toBe(0);

    useAppStore.getState().skipTour();
    expect(useAppStore.getState().isTourOpen).toBe(false);
  });
});
