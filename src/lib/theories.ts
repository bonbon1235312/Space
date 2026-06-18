export type Theory = {
  id: string;
  title: string;
  /** label shown in the left-hand HUD nav menu (falls back to title) */
  navLabel?: string;
  tag: string;
  /** accent hex used across the 3D mesh, glow and UI card */
  color: string;
  /** world-space position of the glowing sphere inside the galaxy */
  position: [number, number, number];
  radius: number;
  /** camera offset from the sphere when focused (frames it to the left of the card) */
  camOffset: [number, number, number];
  summary: string;
  body: string[];
  facts: { label: string; value: string }[];
};

export const THEORIES: Theory[] = [
  {
    id: "big-bang",
    title: "The Big Bang",
    navLabel: "Universe Alpha: The Big Bang",
    tag: "Origin · 13.8 Billion Years Ago",
    color: "#ffb454",
    position: [0, 0, 0],
    radius: 1.25,
    camOffset: [-2.6, 0.8, 4.2],
    summary:
      "Everything that exists — space, time, matter and energy — erupted from an unimaginably hot, dense point.",
    body: [
      "Around 13.8 billion years ago the entire observable universe was compressed into a region smaller than an atom. In the first fraction of a second it underwent exponential 'inflation', expanding faster than light and stretching microscopic quantum ripples into the seeds of every galaxy.",
      "As it cooled, raw energy condensed into the first particles, then the first atoms. Roughly 380,000 years later light finally broke free of the plasma — radiation we still detect today as the Cosmic Microwave Background, the faint afterglow of creation itself.",
      "Crucially, the Big Bang was not an explosion in space. It was the expansion of space. Every point in the cosmos was once that same point — there is no centre, because the centre is everywhere.",
    ],
    facts: [
      { label: "Age of universe", value: "13.8 Gyr" },
      { label: "CMB temperature", value: "2.725 K" },
      { label: "First light", value: "380,000 yrs" },
      { label: "Observable radius", value: "46.5 Bly" },
    ],
  },
  {
    id: "black-holes",
    title: "Black & White Holes",
    navLabel: "Universe Beta: The Singularity Mirror",
    tag: "Gravity · Points of No Return",
    color: "#9b7bff",
    position: [5.4, 0.4, -1.6],
    radius: 0.85,
    camOffset: [-2.2, 0.6, 3.4],
    summary:
      "Where gravity becomes so extreme that not even light escapes — and their hypothetical time-reversed twins.",
    body: [
      "A black hole forms when a massive star collapses under its own gravity, crushing its matter into a singularity wrapped inside an event horizon — a boundary beyond which nothing can return, not even light.",
      "General relativity permits a mirror solution: the white hole, a region nothing can enter and from which matter and light perpetually pour out. If both exist, a black hole and a white hole could be two mouths of a single wormhole bridging distant regions of spacetime.",
      "At the horizon, time itself dilates toward infinity. To a distant observer an infalling object never quite crosses over — it appears to freeze, dim, and redshift into darkness, suspended forever at the edge.",
    ],
    facts: [
      { label: "First image", value: "2019 · M87*" },
      { label: "Sgr A* mass", value: "4.3M ☉" },
      { label: "Escape speed", value: "> c" },
      { label: "Singularity", value: "ρ → ∞" },
    ],
  },
  {
    id: "parallel-universes",
    title: "Parallel Universes",
    navLabel: "Universe Gamma: Parallel Dimensions",
    tag: "Multiverse · Infinite Possibility",
    color: "#3fe0c5",
    position: [-4.7, -0.3, 3.6],
    radius: 0.85,
    camOffset: [2.4, 0.6, 3.4],
    summary:
      "Our universe may be one of countless others — bubbles, branches or membranes beyond our horizon.",
    body: [
      "Cosmic inflation may never fully switch off, endlessly spawning 'bubble' universes, each cooling into its own laws of physics. Ours could be a single bubble adrift in an eternally inflating sea we can never reach.",
      "Quantum mechanics offers a stranger route. The Many-Worlds interpretation proposes that every quantum measurement splits reality, branching the universe into parallel histories in which every possible outcome genuinely happens.",
      "String theory hints at higher-dimensional 'branes' floating in a vast bulk — entire universes separated from ours by a dimension we cannot perceive, occasionally drifting close enough to collide and ignite new big bangs.",
    ],
    facts: [
      { label: "Tegmark levels", value: "I – IV" },
      { label: "Quantum branches", value: "∞" },
      { label: "Extra dimensions", value: "up to 11" },
      { label: "Status", value: "Hypothetical" },
    ],
  },
];
