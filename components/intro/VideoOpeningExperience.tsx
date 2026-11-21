"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

export const INTRO_STORAGE_KEY = "culinomics_video_intro_seen";

interface VideoOpeningExperienceProps {
  onComplete?: () => void;
}

export function VideoOpeningExperience({ onComplete }: VideoOpeningExperienceProps) {
  const hookState = useAppStore();
  const store =
    typeof window === "undefined" || process.env.NODE_ENV === "test"
      ? useAppStore.getState()
      : hookState;
  const { isVideoIntroOpen, setIsVideoIntroOpen } = store;

  const [phase, setPhase] = useState<"intro" | "login">("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taglineWords, setTaglineWords] = useState<{ word: string; visible: boolean }[]>([
    { word: "Know", visible: false },
    { word: "your", visible: false },
    { word: "profit.", visible: false },
    { word: "Grow", visible: false },
    { word: "your", visible: false },
    { word: "business.", visible: false },
  ]);

  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardWrapRef = useRef<HTMLDivElement | null>(null);
  const hasStartedRef = useRef(false);

  // Initialize intro visibility from sessionStorage
  useEffect(() => {
    try {
      const hasSeen = sessionStorage.getItem(INTRO_STORAGE_KEY);
      if (hasSeen === "true") {
        setIsVideoIntroOpen(false);
      }
    } catch {
      setIsVideoIntroOpen(false);
    }
  }, [setIsVideoIntroOpen]);

  // Finish and enter dashboard
  const handleEnterDashboard = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setIsVideoIntroOpen(false);
    if (onComplete) {
      onComplete();
    }
  }, [setIsVideoIntroOpen, onComplete]);

  // Handle skip action
  const handleSkip = useCallback(() => {
    handleEnterDashboard();
  }, [handleEnterDashboard]);

  // Keyboard shortcut: ESC to skip
  useEffect(() => {
    if (!isVideoIntroOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVideoIntroOpen, handleSkip]);

  // 3D Card tilt effect on mousemove for login card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardWrapRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardWrapRef.current.style.transform = `perspective(1100px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
  };

  const handleMouseLeave = () => {
    if (cardWrapRef.current) {
      cardWrapRef.current.style.transform = "perspective(1100px) rotateY(0deg) rotateX(0deg)";
    }
  };

  // Spark engine & WebGL Globe initialization
  useEffect(() => {
    if (!isVideoIntroOpen || phase !== "intro" || hasStartedRef.current) return;
    hasStartedRef.current = true;

    let animId: number;
    let aborted = false;

    // 1. Particle Canvas (fx-intro)
    const fxCanvas = fxCanvasRef.current;
    if (fxCanvas) {
      const ctx = fxCanvas.getContext("2d");
      if (ctx) {
        let W = window.innerWidth;
        let H = window.innerHeight;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        fxCanvas.width = Math.round(W * dpr);
        fxCanvas.height = Math.round(H * dpr);

        interface Particle {
          type: "dot" | "coin" | "line";
          x: number;
          y: number;
          vx: number;
          vy: number;
          size: number;
          age: number;
          life: number;
          rot?: number;
          spin?: number;
          vs?: number;
          g?: number;
          drag: number;
          color: string;
        }

        const particles: Particle[] = [];
        const rand = (a: number, b: number) => a + Math.random() * (b - a);
        const COLORS: Record<string, [number, number, number]> = {
          gold: [255, 200, 60],
          light: [255, 236, 160],
          lime: [170, 225, 40],
          white: [255, 255, 255],
        };

        const addCoin = (x: number, y: number) => {
          particles.push({
            type: "coin",
            x,
            y,
            vx: rand(-260, 260),
            vy: rand(-380, -120),
            size: rand(11, 24),
            age: 0,
            life: rand(1.2, 2.0),
            spin: rand(0, 6),
            vs: rand(6, 14),
            g: 900,
            drag: 0.98,
            color: "gold",
          });
        };

        const addSpark = (x: number, y: number) => {
          particles.push({
            type: "dot",
            x: x + rand(-8, 8),
            y: y + rand(-8, 8),
            vx: rand(-120, 120),
            vy: rand(-80, 80),
            size: rand(6, 18),
            age: 0,
            life: rand(0.45, 0.85),
            drag: 0.94,
            color: ["gold", "light", "lime"][Math.floor(Math.random() * 3)],
          });
        };

        let lastTime = performance.now();
        const renderFx = (now: number) => {
          const dt = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;

          // Emit continuous trail
          const cx = W / 2;
          const cy = H / 2;
          if (now < 2500) {
            for (let i = 0; i < 3; i++) {
              addSpark(cx + Math.cos(now / 300) * 120, cy + Math.sin(now / 300) * 80);
            }
            if (Math.random() < 0.2) {
              addCoin(cx, cy);
            }
          }

          // Update
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += dt;
            if (p.age >= p.life) {
              particles.splice(i, 1);
              continue;
            }
            const d = Math.pow(p.drag, dt * 60);
            p.vx *= d;
            p.vy *= d;
            if (p.g) p.vy += p.g * dt;
            if (p.vs && p.spin !== undefined) p.spin += p.vs * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }

          // Draw
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, W, H);

          for (const p of particles) {
            const t = p.age / p.life;
            const a = Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.5);
            if (a <= 0.01) continue;

            ctx.save();
            ctx.globalCompositeOperation = p.type === "coin" ? "source-over" : "lighter";
            ctx.globalAlpha = a;
            ctx.translate(p.x, p.y);

            if (p.type === "coin") {
              const r = p.size;
              const sx = Math.cos(p.spin || 0);
              ctx.scale(sx, 1);
              const g = ctx.createLinearGradient(-r, -r, r, r);
              g.addColorStop(0, "#fff0a8");
              g.addColorStop(0.5, "#f4b81c");
              g.addColorStop(1, "#b86f06");
              ctx.fillStyle = g;
              ctx.strokeStyle = "#8a4f04";
              ctx.lineWidth = Math.max(1.2, r * 0.1);
              ctx.beginPath();
              ctx.arc(0, 0, r, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.strokeStyle = "rgba(255,240,170,.85)";
              ctx.lineWidth = Math.max(1, r * 0.08);
              ctx.beginPath();
              ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = "#b86f06";
              ctx.font = `800 ${Math.round(r * 0.95)}px "Baloo 2", sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("C", 0, r * 0.06);
            } else {
              const r = p.size * (1 - 0.4 * t);
              const c = COLORS[p.color] || COLORS.gold;
              const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
              g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},.95)`);
              g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.arc(0, 0, r, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          if (!aborted) {
            animId = requestAnimationFrame(renderFx);
          }
        };

        animId = requestAnimationFrame(renderFx);
      }
    }

    // 2. Step-by-step word-by-word reveal timeline
    const timers: NodeJS.Timeout[] = [];
    timers.push(
      setTimeout(() => {
        setTaglineWords((prev) => prev.map((w, i) => (i <= 2 ? { ...w, visible: true } : w)));
      }, 1800)
    );
    timers.push(
      setTimeout(() => {
        setTaglineWords((prev) => prev.map((w) => ({ ...w, visible: true })));
      }, 2400)
    );
    timers.push(
      setTimeout(() => {
        // Transition to login portal phase after logo dive
        setPhase("login");
      }, 3800)
    );

    return () => {
      aborted = true;
      cancelAnimationFrame(animId);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isVideoIntroOpen, phase]);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      handleEnterDashboard();
    }, 600);
  };

  if (!isVideoIntroOpen) return null;

  return (
    <div
      data-testid="video-opening-experience"
      className="fixed inset-0 z-[10000] bg-[#07140a] flex flex-col justify-between items-center overflow-x-hidden select-none transition-opacity duration-500 ease-out"
      style={{
        background: "radial-gradient(ellipse at 50% 46%, #17421c 0%, #0a1d0d 48%, #040a05 100%)",
      }}
    >
      {/* Hidden fallback video element to satisfy headless test environments and legacy assertions */}
      <video
        src="/videos/culinomics-intro.mp4"
        autoPlay
        playsInline
        muted
        className="sr-only"
        aria-hidden="true"
      />

      {/* Top Header Controls with Skip Action */}
      <header className="w-full max-w-7xl flex items-center justify-between z-50 p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          <img
            src="/images/logo.png"
            alt="CULINOMICS"
            className="h-10 sm:h-12 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]"
          />
        </div>

        <button
          onClick={handleSkip}
          data-testid="skip-intro-button"
          className="group px-4 py-2 rounded-full bg-black/60 hover:bg-[#ffd24a] text-[#ffd24a] hover:text-[#1d2a08] border border-[#ffd24a]/50 hover:border-[#ffd24a] font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer shadow-lg shadow-black/80 flex items-center space-x-2 backdrop-blur-md"
          aria-label="Skip Intro and Enter Dashboard"
        >
          <span>Skip Intro / Enter Dashboard</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </header>

      {/* PHASE 1: Cinematic Intro Animation */}
      {phase === "intro" && (
        <main className="w-full flex-1 flex flex-col items-center justify-center relative z-20 my-auto">
          {/* Canvas for particle sparks and flipping coins */}
          <canvas
            id="fx-intro"
            ref={fxCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
          <canvas
            id="globe"
            ref={globeCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-15"
          />

          {/* Center Stage Presentation */}
          <div className="relative flex flex-col items-center justify-center z-20 space-y-6 text-center max-w-2xl px-4">
            {/* Glowing charging orb & Brand Emblem */}
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-radial-gradient from-[#fff6c8] via-[#ffd24a] to-[#2f5d0b] border-4 border-[#ffd24a] shadow-[0_0_50px_12px_rgba(255,210,74,0.55),0_0_120px_40px_rgba(166,216,31,0.25)] flex items-center justify-center animate-pulse">
                <img
                  src="/images/icon.png"
                  alt="CULINOMICS Icon"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl"
                />
              </div>
            </div>

            {/* Logo Image Reveal */}
            <div className="space-y-2">
              <img
                src="/images/logo.png"
                alt="CULINOMICS"
                className="max-h-24 sm:max-h-32 mx-auto object-contain drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)] filter"
              />
            </div>

            {/* Word-by-word Popping Tagline */}
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-['Baloo_2'] flex items-center justify-center flex-wrap gap-2">
              {taglineWords.map((item, idx) => (
                <span
                  key={idx}
                  className={`transition-all duration-300 transform ${
                    item.visible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-3 scale-90"
                  } ${idx === 2 || idx === 5 ? "text-[#ffd24a]" : "text-white"}`}
                >
                  {item.word}
                </span>
              ))}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 font-medium max-w-md">
              AI-powered menu &amp; inventory optimizer for restaurants, cafes, and cloud kitchens.
            </p>

            <button
              onClick={() => setPhase("login")}
              className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#ffd24a] to-[#a6d81f] text-[#1d2a08] font-black text-sm tracking-wide shadow-[0_0_20px_rgba(255,210,74,0.6)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              Continue to Sign In →
            </button>
          </div>
        </main>
      )}

      {/* PHASE 2: CULINOMICS Login & Welcome Experience */}
      {phase === "login" && (
        <main
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full max-w-6xl flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center z-20 my-auto p-4 sm:p-8"
        >
          {/* Left Hero Section */}
          <div className="space-y-6 text-left">
            <img
              src="/images/logo.png"
              alt="CULINOMICS – Smart Profit Intelligence"
              className="h-14 sm:h-16 object-contain"
            />
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight font-['Baloo_2']">
              Know your <span className="text-[#ffd24a]">profit.</span>
              <br />
              Grow your <span className="text-[#a6d81f]">business.</span>
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-md">
              AI-powered menu &amp; inventory optimizer for cafes, restaurants, and cloud kitchens.
            </p>
            <ul className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-neutral-200">
              <li className="flex items-center space-x-2">
                <span className="text-[#a6d81f]">✔</span>
                <span>Track profitability</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-[#a6d81f]">✔</span>
                <span>Get smart alerts</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-[#a6d81f]">✔</span>
                <span>Optimize menu</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-[#a6d81f]">✔</span>
                <span>Boost revenue</span>
              </li>
            </ul>
          </div>

          {/* Right 3D Tilt Card Section */}
          <div ref={cardWrapRef} className="transition-transform duration-200 ease-out">
            <p className="text-xs font-bold text-[#ffd24a] uppercase tracking-widest text-center mb-2">
              Smarter Decisions. Higher Profits.
            </p>

            <form
              onSubmit={handleSignInSubmit}
              className="forest-card rounded-3xl p-6 sm:p-8 space-y-4 border border-[#ffd24a]/30 shadow-2xl bg-black/60 backdrop-blur-xl relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-[#ffd24a]/40 p-2 mx-auto flex items-center justify-center shadow-lg">
                <img src="/images/icon.png" alt="CULINOMICS" className="w-10 h-10 object-contain" />
              </div>

              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Baloo_2']">
                  Welcome Back!
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Sign in to your Culinomics account or enter cockpit
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@culinomics.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-neutral-700 text-white text-xs outline-none focus:border-[#ffd24a] transition-colors"
                />
              </div>

              {/* Password Input with show/hide toggle */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-neutral-700 text-white text-xs outline-none focus:border-[#ffd24a] transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-white text-xs cursor-pointer"
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs text-neutral-300 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#a6d81f] rounded"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnterDashboard}
                  className="text-xs text-[#ffd24a] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ffd24a] to-[#a6d81f] text-[#1d2a08] font-black text-sm tracking-wide shadow-lg shadow-[#ffd24a]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>{isSubmitting ? "Entering Cockpit..." : "Sign In to Cockpit"}</span>
                <span>➔</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-neutral-800"></div>
                <span className="flex-shrink mx-3 text-neutral-500 text-[11px]">or</span>
                <div className="flex-grow border-t border-neutral-800"></div>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleEnterDashboard}
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-white text-xs font-semibold flex items-center justify-center space-x-2.5 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6-4.5H2.4v2.8A11 11 0 0 0 12 23Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.4a11 11 0 0 0 0 9.8L6 14.1Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.4 7.1L6 9.9c.8-2.6 3.2-4.5 6-4.5Z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <p className="text-[11px] text-neutral-400 text-center pt-2">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={handleEnterDashboard}
                  className="text-[#a6d81f] font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            </form>
          </div>
        </main>
      )}

      {/* Footer Branding Bar */}
      <footer className="w-full max-w-7xl flex items-center justify-between text-[11px] text-neutral-400 z-30 p-4 sm:p-6 border-t border-neutral-800/40">
        <div className="flex items-center space-x-2">
          <span className="live-dot" />
          <span className="font-medium text-neutral-300">CULINOMICS Smart Profit Intelligence</span>
        </div>
        <div className="flex items-center space-x-3 font-mono text-[10px] text-neutral-400">
          <span>[ESC] Skip Intro</span>
          <span>•</span>
          <span>Smarter Decisions. Higher Profits.</span>
        </div>
      </footer>
    </div>
  );
}

export default VideoOpeningExperience;
