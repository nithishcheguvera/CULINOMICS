"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CulinomicsLogo, GoldCoinMark } from "@/components/brand";

export const INTRO_STORAGE_KEY = "culinomics_video_intro_seen";

interface VideoOpeningExperienceProps {
  onComplete?: () => void;
}

export function VideoOpeningExperience({ onComplete }: VideoOpeningExperienceProps) {
  const hookState = useAppStore();
  const store = typeof window === "undefined" || process.env.NODE_ENV === "test" ? useAppStore.getState() : hookState;
  const { isVideoIntroOpen, setIsVideoIntroOpen } = store;
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(6.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize intro visibility from sessionStorage
  useEffect(() => {
    try {
      const hasSeen = sessionStorage.getItem(INTRO_STORAGE_KEY);
      if (hasSeen === "true") {
        setIsVideoIntroOpen(false);
      }
    } catch {
      // If sessionStorage is unavailable, default so user is never trapped
      setIsVideoIntroOpen(false);
    }
  }, [setIsVideoIntroOpen]);

  // Complete and transition into dashboard
  const handleComplete = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    } catch {
      // ignore
    }

    setIsFadingOut(true);
    setTimeout(() => {
      setIsVideoIntroOpen(false);
      setIsFadingOut(false);
      if (onComplete) {
        onComplete();
      }
    }, 450);
  }, [setIsVideoIntroOpen, onComplete]);

  // Keyboard accessibility: ESC or Enter to Skip
  useEffect(() => {
    if (!isVideoIntroOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        handleComplete();
      } else if (e.key === " " && videoRef.current) {
        // Space to toggle play/pause
        e.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else if (e.key.toLowerCase() === "m") {
        // M to toggle mute
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVideoIntroOpen, handleComplete]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 6.85;
      setCurrentTime(cur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleVideoError = () => {
    setHasError(true);
  };

  if (!isVideoIntroOpen) return null;

  return (
    <div
      data-testid="video-opening-experience"
      className={`fixed inset-0 z-[10000] bg-forest-black flex flex-col justify-between items-center px-4 py-4 sm:py-6 overflow-hidden select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(ellipse at 50% 45%, #0d1e16 0%, #050b08 70%, #020504 100%)",
      }}
    >
      {/* Top Navigation & Skip Header */}
      <header className="w-full max-w-5xl flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <CulinomicsLogo size="sm" variant="horizontal" subtitle="Opening Experience" />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleComplete}
            data-testid="skip-intro-button"
            className="group px-4 py-2 rounded-xl bg-forest-elevated/90 hover:bg-emerald-500 text-neutral-200 hover:text-neutral-950 border border-emerald-500/40 hover:border-emerald-400 font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer shadow-lg shadow-black/60 flex items-center space-x-2 backdrop-blur-md"
            aria-label="Skip Intro and Enter Dashboard"
          >
            <span>Skip Intro / Enter Dashboard</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>
      </header>

      {/* Main Video Viewport (Responsive Frame) */}
      <main className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center my-auto py-2 z-10 relative">
        {/* Ambient Backlight Glow */}
        <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-500/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(212,175,55,0.15)] bg-neutral-950 flex flex-col items-center justify-center max-h-[78vh] aspect-[480/848] w-auto">
          {hasError ? (
            <div className="p-8 text-center space-y-4 max-w-sm">
              <GoldCoinMark size={56} className="mx-auto" />
              <h3 className="text-base font-bold text-white">CULINOMICS</h3>
              <p className="text-xs text-neutral-400">
                Opening media initialized. Click below to enter the 3D Profit Intelligence Cockpit.
              </p>
              <button
                onClick={handleComplete}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-sm hover:bg-emerald-400 transition-colors"
              >
                Enter Dashboard Now →
              </button>
            </div>
          ) : (
            <>
              {/* HTML5 Native Video Tag */}
              <video
                ref={videoRef}
                src="/videos/culinomics-intro.mp4"
                autoPlay
                playsInline
                muted={isMuted}
                preload="auto"
                onEnded={handleComplete}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={handleVideoError}
                onClick={togglePlayPause}
                className="w-full h-full object-cover cursor-pointer"
                aria-label="CULINOMICS Introduction Video"
              />

              {/* In-Video Overlay Play/Pause Indicator (shown when paused) */}
              {!isPlaying && (
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 border border-emerald-500/60 text-white flex items-center justify-center text-xl shadow-2xl backdrop-blur-sm cursor-pointer"
                  aria-label="Play Video"
                >
                  ▶
                </button>
              )}

              {/* Bottom In-Video Controls Strip */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col space-y-2">
                {/* Sleek Progress Line */}
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-300 px-1 pt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={togglePlayPause}
                      className="p-1 hover:text-white transition-colors cursor-pointer text-xs"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? "⏸" : "▶"}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="p-1 hover:text-white transition-colors cursor-pointer text-xs flex items-center space-x-1"
                      aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
                    >
                      <span>{isMuted ? "🔇" : "🔊"}</span>
                      <span className="text-[10px] text-neutral-400 hidden sm:inline">
                        {isMuted ? "Unmute" : "Muted"}
                      </span>
                    </button>
                  </div>

                  <span className="font-mono text-[10px] text-neutral-400">
                    {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="w-full max-w-5xl flex items-center justify-between text-[11px] text-neutral-500 z-20">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cinematic Opening Experience</span>
        </div>
        <div className="hidden sm:flex items-center space-x-3 font-mono text-[10px]">
          <span>[ESC] Skip Intro</span>
          <span>•</span>
          <span>[SPACE] Play/Pause</span>
          <span>•</span>
          <span>[M] Mute/Unmute</span>
        </div>
      </footer>
    </div>
  );
}

export default VideoOpeningExperience;
