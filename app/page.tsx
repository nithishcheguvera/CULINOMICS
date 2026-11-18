export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto p-8 font-sans">
      <div className="border border-neutral-300 dark:border-neutral-700 rounded-lg p-6 space-y-6">
        <header className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Stage 0 Architecture Verification</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              System Ready
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Google Antigravity Technical Constitution Baseline
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Architectural Invariants & Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900">
              <span className="font-medium">Pure Engine Isolation (/engine)</span>
              <p className="text-xs text-neutral-500 mt-1">
                Zero UI imports. Pure TypeScript financial math with Vitest unit tests.
              </p>
            </div>
            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900">
              <span className="font-medium">3D Visualization Scaffold (/three)</span>
              <p className="text-xs text-neutral-500 mt-1">
                Client-side R3F/Drei components reading from store. Visual design TBD.
              </p>
            </div>
            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900">
              <span className="font-medium">AI & Tool Calling (/ai)</span>
              <p className="text-xs text-neutral-500 mt-1">
                Gemini SDK configured for server API routes only with engine tool definitions.
              </p>
            </div>
            <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-900">
              <span className="font-medium">State & Persistence (/store, /db)</span>
              <p className="text-xs text-neutral-500 mt-1">
                Zustand single source of truth + Dexie IndexedDB storage layer.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Decisions Kept Open (Section 10)</h2>
          <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>UI/UX Design, color palette, and layout are intentionally unfinalized.</li>
            <li>3D scene layout, camera models, and visual design are intentionally unfinalized.</li>
            <li>Branding, logo, and final product naming remain open.</li>
          </ul>
        </section>

        <footer className="text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 pt-4">
          Culinomics Project &bull; Stage 0 Baseline Scaffold &bull; Google Antigravity
        </footer>
      </div>
    </main>
  );
}
