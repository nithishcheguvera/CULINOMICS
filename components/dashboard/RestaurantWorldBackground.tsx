"use client";

import React, { useEffect, useRef } from "react";

interface BgItem {
  t: "coin" | "note" | "hat" | "bars";
  x: number;
  y: number;
  s: number;
  v: number;
  ph: number;
  a: number;
}

export function RestaurantWorldBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let BW = 0;
    let BH = 0;

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const handleResize = () => {
      const r = Math.min(window.devicePixelRatio || 1, 1.5);
      BW = window.innerWidth;
      BH = window.innerHeight;
      canvas.width = Math.round(BW * r);
      canvas.height = Math.round(BH * r);
      ctx.setTransform(r, 0, 0, r, 0, 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // 30 floating restaurant items
    const types: ("coin" | "note" | "hat" | "bars" | "coin")[] = ["coin", "note", "hat", "bars", "coin"];
    const items: BgItem[] = Array.from({ length: 30 }, (_, i) => ({
      t: types[i % 5] as "coin" | "note" | "hat" | "bars",
      x: rnd(0, 1),
      y: rnd(0, 1.1),
      s: rnd(15, 34),
      v: rnd(0.012, 0.04),
      ph: rnd(0, 6),
      a: rnd(0.14, 0.32),
    }));

    const drawItem = (it: BgItem, now: number) => {
      const x = it.x * BW + Math.sin(now / 1800 + it.ph) * 24;
      const y = it.y * BH;
      const s = it.s;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = it.a * Math.min(1, it.y * 6) * Math.min(1, (1.1 - it.y) * 6);

      if (it.t === "coin") {
        ctx.scale(Math.cos(now / 700 + it.ph), 1);
        const g = ctx.createLinearGradient(-s, -s, s, s);
        g.addColorStop(0, "#fff0a8");
        g.addColorStop(0.5, "#f4b81c");
        g.addColorStop(1, "#b86f06");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#fff0a8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.43, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#9a5a05";
        ctx.font = `800 ${Math.round(s * 0.6)}px "Baloo 2", sans-serif, system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₹", 0, 1);
      } else if (it.t === "note") {
        ctx.rotate(Math.sin(now / 2000 + it.ph) * 0.4);
        ctx.fillStyle = "#2e9a4c";
        ctx.strokeStyle = "#a6e22e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-s * 0.8, -s * 0.45, s * 1.6, s * 0.9, 5);
        } else {
          ctx.rect(-s * 0.8, -s * 0.45, s * 1.6, s * 0.9);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#a6e22e";
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.t === "hat") {
        ctx.rotate(Math.sin(now / 2200 + it.ph) * 0.35);
        ctx.fillStyle = "#f6f1e3";
        [
          [-0.38, -0.15, 0.34],
          [0, -0.38, 0.42],
          [0.38, -0.15, 0.34],
        ].forEach(([a, b, r]) => {
          ctx.beginPath();
          ctx.arc(a * s, b * s, r * s, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillRect(-0.55 * s, -0.1 * s, 1.1 * s, 0.6 * s);
        ctx.fillStyle = "#a6e22e";
        ctx.fillRect(-0.55 * s, 0.38 * s, 1.1 * s, 0.14 * s);
      } else {
        // rising profit bars
        const g = (Math.sin(now / 900 + it.ph) + 1) / 2;
        ctx.fillStyle = "#a6e22e";
        [0.45, 0.75, 1].forEach((h, i) => {
          ctx.fillRect(
            -s * 0.6 + i * s * 0.46,
            s * 0.6 - s * 1.1 * h * (0.65 + 0.35 * g),
            s * 0.32,
            s * 1.1 * h * (0.65 + 0.35 * g)
          );
        });
      }

      ctx.restore();
    };

    const render = (now: number) => {
      ctx.clearRect(0, 0, BW, BH);

      // Render floating items
      items.forEach((it) => {
        it.y -= it.v * 0.016;
        if (it.y < -0.05) {
          it.y = 1.1;
          it.x = rnd(0, 1);
        }
        drawItem(it, now);
      });

      // Layered "profit terrain" waves along the bottom
      const waves: [number, number, number, number, string][] = [
        [0.06, 90, 0.004, 1.3, "rgba(166,216,31,0.07)"],
        [0.1, 60, 0.006, 1.9, "rgba(255,210,74,0.06)"],
        [0.14, 38, 0.009, 2.6, "rgba(166,216,31,0.09)"],
      ];

      waves.forEach(([base, amp, f, sp, col]) => {
        ctx.beginPath();
        ctx.moveTo(0, BH);
        for (let x = 0; x <= BW + 14; x += 14) {
          ctx.lineTo(
            x,
            BH -
              BH * base -
              (Math.sin(x * f + (now / 1000) * sp * 0.5) +
                Math.sin(x * f * 2.3 - (now / 1400) * sp) * 0.5) *
                amp *
                0.35
          );
        }
        ctx.lineTo(BW, BH);
        ctx.fillStyle = col;
        ctx.fill();
      });

      // A glowing profit line that climbs and restarts every 7s
      const p = (now / 7000) % 1;
      const e = Math.min(1, p * 1.25);
      const pts = 40;
      const path: [number, number][] = [];

      for (let i = 0; i <= pts * e; i++) {
        const u = i / pts;
        path.push([
          BW * (0.05 + u * 0.9),
          BH * (0.9 - u * 0.55 - Math.sin(u * 14) * 0.02 * (1 - u)),
        ]);
      }

      if (path.length > 2) {
        ctx.globalAlpha = p > 0.8 ? (1 - p) * 5 : 1;
        ctx.strokeStyle = "rgba(190,255,60,0.35)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#b6f21e";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        path.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.stroke();

        const q = path[path.length - 1];
        const r = path[path.length - 2];
        const ang = Math.atan2(q[1] - r[1], q[0] - r[0]);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,210,74,0.7)";
        ctx.save();
        ctx.translate(q[0], q[1]);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -9);
        ctx.lineTo(-8, 9);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />
      <canvas
        id="bg"
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />
    </>
  );
}

export default RestaurantWorldBackground;
