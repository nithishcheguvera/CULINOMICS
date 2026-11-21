import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { CulinomicsLogo, GoldCoinMark } from "./CulinomicsLogo";

describe("Brand Identity: Gold Coin CL Monogram & CULINOMICS Logo", () => {
  it("renders pure SVG Gold Coin Mark with CL monogram geometry and metallic gradients", () => {
    const html = renderToString(<GoldCoinMark size={48} />);

    // Check SVG attributes and accessibility
    expect(html).toContain("<svg");
    expect(html).toContain("width=\"48\"");
    expect(html).toContain("height=\"48\"");
    expect(html).toContain("viewBox=\"0 0 100 100\"");
    expect(html).toContain("aria-label=\"CULINOMICS Gold Coin CL Monogram\"");

    // Check metallic gradients and filters
    expect(html).toContain("culinomics-gold-coin-rim");
    expect(html).toContain("culinomics-gold-coin-face");
    expect(html).toContain("culinomics-gold-coin-monogram");
    expect(html).toContain("culinomics-gold-coin-shadow");

    // Check concentric coin circles and milled edge
    expect(html).toContain("stroke-dasharray=\"1.2 1.8\"");
  });

  it("renders horizontal variant with Gold Coin Mark and CULINOMICS logotype", () => {
    const html = renderToString(<CulinomicsLogo variant="horizontal" size="md" />);

    expect(html).toContain("CULINOMICS");
    expect(html).toContain("3D Profit Intelligence Cockpit");
    expect(html).toContain("<svg");
  });

  it("renders vertical stacked variant", () => {
    const html = renderToString(<CulinomicsLogo variant="vertical" size="lg" subtitle="Executive Profit Analytics" />);

    expect(html).toContain("CULINOMICS");
    expect(html).toContain("Executive Profit Analytics");
    expect(html).toContain("flex flex-col items-center");
  });

  it("renders mark-only variant when variant='mark'", () => {
    const html = renderToString(<CulinomicsLogo variant="mark" size="sm" />);

    expect(html).toContain("<svg");
    expect(html).not.toContain("<span>CULINOMICS</span>");
  });
});
