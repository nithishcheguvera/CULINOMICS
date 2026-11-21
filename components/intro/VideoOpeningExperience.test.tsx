import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { VideoOpeningExperience, INTRO_STORAGE_KEY } from "./VideoOpeningExperience";
import { useAppStore } from "@/store/useAppStore";

describe("Video Opening Experience Component", () => {
  beforeEach(() => {
    useAppStore.setState({ isVideoIntroOpen: true });
  });

  it("renders introductory screen with HTML5 video player and skip button when open", () => {
    const html = renderToString(<VideoOpeningExperience />);

    expect(html).toContain("data-testid=\"video-opening-experience\"");
    expect(html).toContain("src=\"/videos/culinomics-intro.mp4\"");
    expect(html).toContain("data-testid=\"skip-intro-button\"");
    expect(html).toContain("Skip Intro / Enter Dashboard");
    expect(html).toContain("CULINOMICS");
  });

  it("renders video element with muted autoplay attributes for universal browser compatibility", () => {
    const html = renderToString(<VideoOpeningExperience />);

    expect(html.toLowerCase()).toContain("autoplay");
    expect(html.toLowerCase()).toContain("playsinline");
    expect(html.toLowerCase()).toContain("muted");
  });

  it("does not render when isVideoIntroOpen is false", () => {
    useAppStore.setState({ isVideoIntroOpen: false });
    const html = renderToString(<VideoOpeningExperience />);

    expect(html).toBe("");
  });

  it("exports valid storage key for persistent session handling", () => {
    expect(INTRO_STORAGE_KEY).toBe("culinomics_video_intro_seen");
  });
});
