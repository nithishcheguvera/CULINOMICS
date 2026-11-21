"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COL = {
  Star: [255, 210, 74],       // #ffd24a
  Plowhorse: [166, 216, 31],  // #a6d81f
  Puzzle: [96, 200, 255],     // #60c8ff
  Dog: [240, 90, 70],         // #f05a46
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const rgb = (c: number[], s: number, a: number = 1) =>
  `rgba(${(c[0] * s) | 0},${(c[1] * s) | 0},${(c[2] * s) | 0},${a})`;

const EDGES: [number, number, number, number, number, number][] = [
  [1, 0, 0.5, -0.5, 0.5, 0.5],
  [0, 1, 0.5, 0.5, -0.5, 0.5],
  [-1, 0, -0.5, 0.5, -0.5, -0.5],
  [0, -1, -0.5, -0.5, 0.5, -0.5],
];

export function ProfitTerrainCanvas() {
  const store = useAppStore();
  const {
    dishProfitability,
    menuEngineering,
    selectedDishId,
    selectedTimelineDate,
    timelineDates,
    recipeReplay,
    setSelectedDishId,
    setSelectedTimelineDate,
  } = store;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeMode, setActiveMode] = useState<"Field" | "Time" | "Breakdown">("Field");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);

  // Animation & simulation state ref
  const animStateRef = useRef({
    t: 0,
    tv: 0,
    yaw: 0.62,
    zoom: 1,
    focus: false,
    px: 0,
    py: 0,
    intro: 0,
    play: false,
    wf: 0,
    wfOn: false,
    hovered: null as number | null,
    drag: null as { x: number; m: number } | null,
    tops: [] as [number, number][],
    mode: "Field" as "Field" | "Time" | "Breakdown",
  });

  // Sync mode changes to ref
  useEffect(() => {
    animStateRef.current.mode = activeMode;
    if (activeMode === "Breakdown") {
      animStateRef.current.wfOn = true;
    } else {
      animStateRef.current.wfOn = false;
    }
  }, [activeMode]);

  // Sync month from timeline dates if selectedTimelineDate changes
  useEffect(() => {
    if (timelineDates && selectedTimelineDate) {
      const idx = timelineDates.indexOf(selectedTimelineDate);
      if (idx >= 0) {
        setActiveMonthIdx(idx);
        animStateRef.current.t = idx;
      }
    }
  }, [selectedTimelineDate, timelineDates]);

  // Dishes data adapted for the 3D terrain
  const dishes = React.useMemo(() => {
    if (!dishProfitability || dishProfitability.length === 0) return [];
    return dishProfitability.map((d, k) => {
      const matrixDish = menuEngineering?.dishes.find((m) => m.dishId === d.dishId);
      const cat = matrixDish?.category;
      let categoryType: "Star" | "Plowhorse" | "Puzzle" | "Dog" = "Puzzle";
      if (cat === "STAR") categoryType = "Star";
      else if (cat === "PLOWHORSE") categoryType = "Plowhorse";
      else if (cat === "PUZZLE") categoryType = "Puzzle";
      else if (cat === "DOG") categoryType = "Dog";

      const replay = recipeReplay?.find((r) => r.dishId === d.dishId);
      const janPt = replay?.points[0];
      const decPt = replay?.points[replay.points.length - 1];
      const dropPts = janPt && decPt ? (janPt.marginPercentage - decPt.marginPercentage) : 0;

      return {
        id: d.dishId,
        name: d.dishName,
        price: d.unitSellingPrice,
        cost: d.unitIngredientCost,
        volume: Math.round(d.totalVolume / 12),
        marginPct: d.contributionMarginPercentage / 100,
        monthlyProfit: Math.round(d.totalContribution / 12),
        category: categoryType,
        dropPts,
        k,
      };
    });
  }, [dishProfitability, menuEngineering, recipeReplay]);

  // Main 3D isometric animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dishes.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0;
    let H = 0;
    let TW = 20;
    let ox = 0;
    let oy = 0;
    let sc = 1;

    const S = animStateRef.current;

    // Dust particles
    const dust = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 2 + 0.6,
      v: Math.random() * 0.0004 + 0.00012,
      p: Math.random() * 6,
    }));

    const handleResize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const P = (x: number, y: number, z: number): [number, number, number] => {
      const dx = x - 6;
      const dy = y - 6;
      const C = Math.cos(S.yaw);
      const Sn = Math.sin(S.yaw);
      const rx = dx * C - dy * Sn;
      const ry = dx * Sn + dy * C;
      return [(rx - ry) * TW, (rx + ry) * TW * 0.5 - z * sc, rx + ry];
    };

    const S2 = (x: number, y: number, z: number): [number, number] => {
      const p = P(x, y, z);
      return [ox + p[0], oy + p[1]];
    };

    const pillar = (
      x: number,
      y: number,
      w: number,
      z0: number,
      h: number,
      c: number[],
      alpha = 1,
      glow = 0
    ) => {
      const C = Math.cos(S.yaw);
      const Sn = Math.sin(S.yaw);
      const z1 = z0 + h;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = rgb(c, 1);
      ctx.shadowBlur = glow;

      for (const [nx, ny, ax, ay, bx, by] of EDGES) {
        const nrx = nx * C - ny * Sn;
        const nry = nx * Sn + ny * C;
        if (nrx + nry <= 0) continue;
        const q = [
          S2(x + ax * 2 * w, y + ay * 2 * w, z0),
          S2(x + bx * 2 * w, y + by * 2 * w, z0),
          S2(x + bx * 2 * w, y + by * 2 * w, z1),
          S2(x + ax * 2 * w, y + ay * 2 * w, z1),
        ];
        const g = ctx.createLinearGradient(0, q[3][1], 0, q[0][1]);
        const sh = clamp(0.62 + (nry - nrx) * 0.3, 0.35, 0.95);
        g.addColorStop(0, rgb(c, sh));
        g.addColorStop(1, rgb(c, sh * 0.55));
        ctx.fillStyle = g;
        ctx.beginPath();
        q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.fill();
      }

      const t = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([a, b]) => S2(x + a * w, y + b * w, z1));

      ctx.shadowBlur = 0;
      ctx.fillStyle = rgb(c, 1);
      ctx.beginPath();
      t.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const label = (text: string, x: number, y: number, color = "#ffd24a") => {
      ctx.font = '800 13px "Nunito", system-ui, sans-serif';
      const w = ctx.measureText(text).width + 20;
      ctx.fillStyle = "rgba(8,24,10,.88)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x - w / 2, y - 26, w, 24, 12);
      } else {
        ctx.rect(x - w / 2, y - 26, w, 24);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f6f1e3";
      ctx.textAlign = "center";
      ctx.fillText(text, x, y - 9);
    };

    // Pillar dynamic animation models
    const vs = dishes.map((d) => d.volume);
    const vmin = Math.min(...vs);
    const vmax = Math.max(...vs);
    const maxProfit = Math.max(...dishes.map((d) => d.monthlyProfit));

    const A = dishes.map(() => ({
      x: 6,
      y: 6,
      h: 0,
      a: 1,
      c: [...COL.Dog],
    }));

    const updateWorld = (now: number) => {
      S.intro = Math.min(1, S.intro + 0.006);
      dishes.forEach((d, k) => {
        const a = A[k];
        const tx = 1.2 + ((d.volume - vmin) / Math.max(1, vmax - vmin)) * 9.6;
        const ty = 1.2 + clamp((d.marginPct - 0.25) / 0.55, 0, 1) * 9.6;
        let th = Math.max(5, (d.monthlyProfit / Math.max(1, maxProfit)) * 140);
        let ta = 1;
        if (S.wfOn) {
          th = 0;
          ta = 0;
        }
        th *= ease(S.intro * 1.8 - k * 0.09);
        a.x = lerp(a.x, tx, 0.1);
        a.y = lerp(a.y, ty, 0.1);
        a.h = lerp(a.h, th, 0.12);
        a.a = lerp(a.a, ta, 0.1);
        const tc = COL[d.category];
        a.c = a.c.map((v, i) => lerp(v, tc[i], 0.08));
      });
      S.wf = lerp(S.wf, S.wfOn ? 1 : 0, 0.08);
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      TW = Math.min(W / 24.5, H / 16.5) * S.zoom;
      sc = (TW / 30) * 1.25;
      ox = W / 2 + S.px;
      oy = H * 0.6 + S.py;

      // Ambient dust
      ctx.globalCompositeOperation = "lighter";
      dust.forEach((d) => {
        d.y -= d.v;
        if (d.y < 0) d.y = 1;
        const x = (d.x + Math.sin(now / 1500 + d.p) * 0.01) * W;
        ctx.fillStyle = `rgba(255,214,90,${0.25 + 0.25 * Math.sin(now / 600 + d.p)})`;
        ctx.beginPath();
        ctx.arc(x, d.y * H, d.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";

      // Ground plane + neon grid + laser scan sweep
      const gp = [
        [0, 0],
        [12, 0],
        [12, 12],
        [0, 12],
      ].map(([x, y]) => S2(x, y, 0));

      ctx.fillStyle = "rgba(20,70,26,.55)";
      ctx.beginPath();
      gp.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.fill();

      ctx.strokeStyle = "rgba(166,216,31,.2)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 12; i += 1) {
        let a = S2(i, 0, 0);
        let b = S2(i, 12, 0);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();

        a = S2(0, i, 0);
        b = S2(12, i, 0);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }

      // Laser scan sweep line
      const sw = ((now / 2600) % 1) * 12;
      const s1 = S2(sw, 0, 0);
      const s2 = S2(sw, 12, 0);
      ctx.strokeStyle = "rgba(190,255,60,.75)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#b6f21e";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(s1[0], s1[1]);
      ctx.lineTo(s2[0], s2[1]);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pillars sorted back-to-front
      const order = dishes
        .map((d, k) => ({ k, z: P(A[k].x, A[k].y, 0)[2] }))
        .sort((a, b) => a.z - b.z);

      const tops: [number, number][] = [];
      const selectedIdx = dishes.findIndex((d) => d.id === selectedDishId);

      order.forEach(({ k }) => {
        const a = A[k];
        const d = dishes[k];
        if (a.a < 0.03) return;

        const isSinking = d.dropPts > 8;
        const isHovered = S.hovered === k;
        const isSelected = selectedIdx === k;
        const lift = isHovered ? 10 : 0;
        const pulse = 0.5 + 0.5 * Math.sin(now / 350 + k);
        const glow = isSinking
          ? 8 + 16 * pulse
          : d.category === "Star"
          ? 10 + 8 * pulse
          : isHovered || isSelected
          ? 16
          : 0;

        const c = isSinking
          ? a.c.map((v, i) => lerp(v, [240, 90, 70][i], 0.45 * pulse))
          : a.c;

        if (isSelected) {
          const r = [
            [-0.9, -0.9],
            [0.9, -0.9],
            [0.9, 0.9],
            [-0.9, 0.9],
          ].map(([u, v]) => S2(a.x + u, a.y + v, 0));
          ctx.strokeStyle = `rgba(255,224,110,${0.55 + 0.4 * pulse})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          r.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
          ctx.closePath();
          ctx.stroke();
        }

        pillar(a.x, a.y, 0.5, 0, a.h + lift, c, a.a, glow);
        const top = S2(a.x, a.y, a.h + lift);
        tops[k] = top;

        if (a.a > 0.6 && isSinking) {
          ctx.fillStyle = "#ff7a66";
          ctx.font = '800 15px "Nunito", system-ui, sans-serif';
          ctx.textAlign = "center";
          ctx.fillText("▼", top[0], top[1] - 12 + Math.sin(now / 250 + k) * 4);
        }

        if (a.a > 0.6 && d.category === "Star") {
          ctx.fillStyle = `rgba(255,240,170,${0.5 + 0.5 * Math.sin(now / 300 + k * 2)})`;
          ctx.font = '800 16px "Nunito", system-ui, sans-serif';
          ctx.textAlign = "center";
          ctx.fillText("✦", top[0] + 10, top[1] - 8 - 3 * Math.sin(now / 400 + k));
        }
      });

      dishes.forEach((d, k) => {
        if (!S.wfOn && tops[k] && (S.hovered === k || selectedIdx === k)) {
          label(d.name, tops[k][0], tops[k][1] - 24, selectedIdx === k ? "#ffd24a" : "#a6d81f");
        }
      });

      S.tops = tops;

      // Waterfall Mode (Breakdown view: Revenue -> Ingredients -> Profit)
      if (S.wf > 0.02 && selectedIdx >= 0) {
        const d = dishes[selectedIdx];
        const rev = d.price * d.volume;
        const cost = d.cost * d.volume;
        const gpf = rev - cost;
        const k = (210 * S.wf) / Math.max(1, rev);
        const y = 6;
        const X = [1.8, 6, 10.2];
        const w = 1.25;
        const bars: [string, number, number, number[], string][] = [
          ["Revenue", 0, rev, [166, 216, 31], "100%"],
          [
            "Ingredients",
            rev - cost,
            cost,
            [240, 90, 70],
            `${((cost / Math.max(1, rev)) * 100).toFixed(0)}% of revenue`,
          ],
          [
            "Profit",
            0,
            gpf,
            [255, 210, 74],
            `${((gpf / Math.max(1, rev)) * 100).toFixed(0)}% margin`,
          ],
        ];

        ctx.globalAlpha = S.wf;
        ctx.setLineDash([7, 6]);
        ctx.strokeStyle = "rgba(255,255,255,.65)";
        ctx.lineWidth = 1.6;

        [
          [0, 1, rev],
          [1, 2, gpf],
        ].forEach(([a, b, v]) => {
          const p = S2(X[a] + w, y, v * k);
          const q = S2(X[b] - w, y, v * k);
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
          ctx.stroke();
        });

        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        bars.forEach(([n, z0, v, c, pc], i) => {
          const h = Math.max(2, v * k);
          const z = z0 * k;
          pillar(X[i], y, w, z, h, c, S.wf, 10);
          const t = S2(X[i], y, z + h);
          const b = S2(X[i], y + 2.1, 0);
          label(formatINR(v), t[0], t[1] - 4, rgb(c, 1));
          ctx.globalAlpha = S.wf;
          ctx.textAlign = "center";
          ctx.fillStyle = "#f6f1e3";
          ctx.font = '800 13px "Nunito", system-ui, sans-serif';
          ctx.fillText(n, b[0], b[1]);
          ctx.fillStyle = rgb(c, 1);
          ctx.font = '700 12px "Nunito", system-ui, sans-serif';
          ctx.fillText(pc, b[0], b[1] + 16);
          ctx.globalAlpha = 1;
        });
      }
    };

    const tick = (now: number) => {
      S.tv = lerp(S.tv, S.t, 0.1);
      if (S.play) {
        S.t = Math.min(11, S.t + 0.014);
        const curM = Math.round(S.t);
        setActiveMonthIdx(curM);
        if (timelineDates && timelineDates[curM]) {
          setSelectedTimelineDate(timelineDates[curM]);
        }
        if (S.t >= 11) {
          S.play = false;
          setIsPlaying(false);
        }
      }

      if (S.wfOn) {
        const tgt =
          -Math.PI / 4 + Math.PI * 2 * Math.round((S.yaw + Math.PI / 4) / (Math.PI * 2));
        S.yaw = lerp(S.yaw, tgt, 0.06);
      } else if (S.hovered === null && !S.drag) {
        S.yaw += 0.0012;
      }

      updateWorld(now);
      draw(now);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [dishes, selectedDishId, timelineDates, setSelectedTimelineDate]);

  // Pointer interactions for orbit drag and click selection
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    animStateRef.current.drag = { x: e.clientX, m: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const S = animStateRef.current;
    if (S.drag) {
      if (!S.wfOn) S.yaw += (e.clientX - S.drag.x) * 0.008;
      S.drag.m += Math.abs(e.clientX - S.drag.x);
      S.drag.x = e.clientX;
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      let best: number | null = null;
      let bd = 26;
      (S.tops || []).forEach((t, k) => {
        if (!t) return;
        const d = Math.hypot(t[0] - x, t[1] - y);
        if (d < bd) {
          bd = d;
          best = k;
        }
      });
      S.hovered = best;
      canvas.style.cursor = best !== null ? "pointer" : "grab";
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const S = animStateRef.current;
    if (S.drag && S.drag.m < 5) {
      if (S.hovered !== null && dishes[S.hovered]) {
        setSelectedDishId(dishes[S.hovered].id);
      }
    }
    S.drag = null;
  };

  const togglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    animStateRef.current.play = next;
    if (next && animStateRef.current.t >= 10.9) {
      animStateRef.current.t = 0;
      setActiveMonthIdx(0);
    }
  };

  const handleMonthSlider = (val: number) => {
    animStateRef.current.t = val;
    animStateRef.current.play = false;
    setIsPlaying(false);
    setActiveMonthIdx(Math.round(val));
    if (timelineDates && timelineDates[Math.round(val)]) {
      setSelectedTimelineDate(timelineDates[Math.round(val)]);
    }
  };

  return (
    <section className="forest-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-xl shadow-black/50 space-y-3">
      {/* Top Header: Title & Sliding Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Baloo_2']">
          Profit Terrain
        </h3>

        {/* Mode Tabs with Sliding Pill */}
        <div className="relative flex bg-black/40 rounded-full p-1 border border-forest-border/60">
          {(["Field", "Time", "Breakdown"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              className={`relative z-10 px-3.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeMode === m
                  ? "bg-gradient-to-b from-[#ffd24a] to-[#e8a90f] text-[#1d2a08] shadow-[0_0_14px_rgba(255,210,74,0.5)]"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Stage Viewport */}
      <div className="relative h-[380px] sm:h-[450px] rounded-xl overflow-hidden bg-radial-gradient from-emerald-950/40 via-black/60 to-black/90 border border-emerald-500/20 shadow-inner">
        <canvas
          id="ter"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => (animStateRef.current.hovered = null)}
          className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
        />

        {/* Bottom Legend */}
        <div className="absolute left-3 bottom-3 flex items-center gap-1.5 flex-wrap z-10">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 border border-[#ffd24a] text-[#ffd24a]">
            Star
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 border border-[#a6d81f] text-[#a6d81f]">
            Plowhorse
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 border border-[#60c8ff] text-[#60c8ff]">
            Puzzle
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 border border-[#f05a46] text-[#f05a46]">
            Dog
          </span>
        </div>

        {/* Back Button (when in Breakdown mode) */}
        {activeMode === "Breakdown" && (
          <button
            onClick={() => setActiveMode("Field")}
            className="absolute left-3 top-3 z-10 border border-[#e8a90f] bg-black/70 text-[#ffd24a] font-bold text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-[#e8a90f] hover:text-neutral-950 transition-colors shadow-lg"
          >
            ‹ All dishes
          </button>
        )}

        {/* Top Right Guidance Hint */}
        <p className="absolute right-3 top-3 text-[11px] font-semibold text-neutral-400 pointer-events-none z-10 animate-pulse">
          {activeMode === "Breakdown"
            ? "Click a dish to see its waterfall"
            : activeMode === "Time"
            ? "Watch dishes sink as costs rise"
            : "Drag to orbit · click a dish"}
        </p>
      </div>

      {/* Bottom Timeline Scrubber Track */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm text-[#1d2a08] bg-gradient-to-b from-[#ffd24a] to-[#e8a90f] shadow-[0_0_16px_rgba(255,210,74,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={11}
            step={0.01}
            value={animStateRef.current.t}
            onChange={(e) => handleMonthSlider(Number(e.target.value))}
            className="culinomics-slider"
            style={{
              // @ts-expect-error custom CSS property
              "--f": `${(animStateRef.current.t / 11) * 100}%`,
            }}
          />
          <div className="flex justify-between text-[10px] font-mono text-neutral-400 px-1">
            {MONTHS.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        <b className="min-w-[48px] text-right text-lg sm:text-xl font-black text-[#a6d81f] font-mono shrink-0">
          {MONTHS[activeMonthIdx]}
        </b>
      </div>
    </section>
  );
}

export default ProfitTerrainCanvas;
