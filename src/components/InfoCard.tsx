"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Theory } from "@/lib/theories";

type Props = {
  theory: Theory | null;
  onClose: () => void;
};

export function InfoCard({ theory, onClose }: Props) {
  return (
    <AnimatePresence mode="wait">
      {theory && (
        <motion.aside
          key={theory.id}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 130, damping: 22 }}
          className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-full max-w-md items-stretch p-4 sm:p-6"
        >
          <div
            className="glass-scroll pointer-events-auto relative flex h-full w-full flex-col overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.045] p-7 shadow-[0_20px_70px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-9"
            style={
              {
                "--accent": theory.color,
              } as React.CSSProperties
            }
          >
            {/* accent glow bleeding from the top */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
              style={{ background: theory.color }}
            />

            {/* close */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="relative">
              <span
                className="inline-block rounded-full border px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.25em]"
                style={{
                  color: theory.color,
                  borderColor: `${theory.color}55`,
                  background: `${theory.color}12`,
                }}
              >
                {theory.tag}
              </span>

              <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white">
                {theory.title}
              </h2>

              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                {theory.summary}
              </p>

              <div className="mt-6 h-px w-full bg-gradient-to-r from-white/15 to-transparent" />

              <div className="mt-6 space-y-4">
                {theory.body.map((paragraph, i) => (
                  <p key={i} className="text-[13.5px] leading-relaxed text-white/55">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {theory.facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                      {fact.label}
                    </p>
                    <p
                      className="mt-1 font-display text-lg font-semibold"
                      style={{ color: theory.color }}
                    >
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
