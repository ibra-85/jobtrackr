export function AuraBackground() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none">
      {/* Radial gradient light effect at top */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[140%] h-[90%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/25 via-transparent to-transparent opacity-70 mix-blend-screen" />
      {/* Noise texture overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
    </div>
  )
}

