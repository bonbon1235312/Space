"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Galaxy } from "@/components/Galaxy";
import { TheorySphere } from "@/components/TheorySphere";
import { Rig } from "@/components/Rig";
import { InfoCard } from "@/components/InfoCard";
import { THEORIES } from "@/lib/theories";

// Explicit per-element delays guarantee a clean top-to-bottom reveal:
// eyebrow -> h1 -> Explore -> button1 -> button2 -> button3 -> hint.
const HUD_BASE_DELAY = 0.15;
const HUD_STAGGER = 0.08;

const hudItem = (index: number) => ({
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: HUD_BASE_DELAY + index * HUD_STAGGER,
    },
  },
});

export default function Scene() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  const activeTheory = THEORIES.find((t) => t.id === activeId) ?? null;

  return (
    <>
      <Canvas
        camera={{ position: [0, 4, 14], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onPointerMissed={() => setActiveId(null)}
      >
        <color attach="background" args={["#04020a"]} />
        <fog attach="fog" args={["#04020a", 18, 38]} />

        <ambientLight intensity={0.18} />
        <pointLight position={[0, 0, 0]} intensity={4} color="#ffb86b" distance={26} decay={1.4} />

        <Stars radius={90} depth={60} count={3500} factor={4} saturation={0} fade speed={0.4} />

        <Galaxy />

        {THEORIES.map((theory) => (
          <TheorySphere
            key={theory.id}
            theory={theory}
            active={activeId === theory.id}
            onSelect={() => setActiveId(theory.id)}
          />
        ))}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          zoomSpeed={0.7}
          minDistance={2.5}
          maxDistance={30}
        />

        <Rig activeId={activeId} controlsRef={controlsRef} />

        <EffectComposer>
          <Bloom
            intensity={1.15}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      </Canvas>

      {/* ---------- HUD ---------- */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10"
        initial="hidden"
        animate="show"
      >
        <header>
          <motion.p
            variants={hudItem(0)}
            className="font-display text-[11px] uppercase tracking-[0.45em] text-white/40"
          >
            An Interactive Cosmos
          </motion.p>
          <motion.h1
            variants={hudItem(1)}
            className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            Cosmic <span className="text-white/45">Theories</span>
          </motion.h1>
        </header>

        <footer className="flex items-end justify-between gap-6">
          <nav className="pointer-events-auto flex flex-col gap-2.5">
            <motion.p
              variants={hudItem(2)}
              className="mb-1 text-[10px] uppercase tracking-[0.3em] text-white/30"
            >
              Explore
            </motion.p>
            {THEORIES.map((theory, i) => {
              const isActive = activeId === theory.id;
              return (
                <motion.button
                  key={theory.id}
                  variants={hudItem(3 + i)}
                  onClick={() => setActiveId(theory.id)}
                  className="group flex items-center gap-3 text-left"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform group-hover:scale-125"
                    style={{
                      background: theory.color,
                      boxShadow: `0 0 12px ${theory.color}`,
                    }}
                  />
                  <span
                    className={`font-display text-sm tracking-wide transition ${
                      isActive
                        ? "text-white"
                        : "text-white/45 group-hover:text-white/85"
                    }`}
                  >
                    {theory.title}
                  </span>
                </motion.button>
              );
            })}
          </nav>

          <motion.p
            variants={hudItem(3 + THEORIES.length)}
            className="hidden text-right text-xs leading-relaxed tracking-wide text-white/35 sm:block"
          >
            Drag to orbit · Scroll to zoom
            <br />
            Click a star to dive in
          </motion.p>
        </footer>
      </motion.div>

      <InfoCard theory={activeTheory} onClose={() => setActiveId(null)} />
    </>
  );
}
