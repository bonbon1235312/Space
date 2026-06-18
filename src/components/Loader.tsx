export function Loader() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#04020a]">
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-tr from-amber-300 via-fuchsia-400 to-indigo-500 blur-[2px]" />
      </div>
      <p className="mt-6 font-display text-xs uppercase tracking-[0.4em] text-white/40">
        Entering the cosmos…
      </p>
    </div>
  );
}
