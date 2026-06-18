"use client";

import dynamic from "next/dynamic";
import { Loader } from "@/components/Loader";

// The 3D scene touches WebGL/DOM APIs, so it must run on the client only.
const Scene = dynamic(() => import("@/components/Scene"), {
  ssr: false,
  loading: () => <Loader />,
});

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#04020a]">
      <Scene />
    </main>
  );
}
