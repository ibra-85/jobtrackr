export function AnimatedGridBackground() {
  return (
    <div className="absolute inset-0 w-full h-full min-h-screen grid grid-cols-1 md:grid-cols-7 gap-0 z-0 pointer-events-none overflow-hidden">
      <div className="relative h-full hidden md:block border-r border-white/5 animate-[fadeInUp_0.8s_ease-out_0.1s_both]">
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 h-[75%] border-t border-white/10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]" />
      </div>
      <div className="relative h-full hidden md:block border-r border-white/5 animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 h-[65%] border-t border-white/10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]" />
      </div>
      <div className="relative h-full hidden md:block border-r border-white/5 animate-[fadeInUp_0.8s_ease-out_0.3s_both]">
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 h-[55%] border-t border-white/10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]" />
      </div>
      <div className="relative h-full border-r border-white/5 md:border-none animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 h-[45%] border-t border-white/10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]" />
        <div className="absolute top-[20%] left-0 right-0 h-[30%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </div>
      <div className="relative h-full hidden md:block border-l border-white/5 animate-[fadeInUp_0.8s_ease-out_0.5s_both]">
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 h-[55%] border-t border-white/10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]" />
      </div>
      <div className="relative h-full hidden md:block border-l border-white/5 animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 h-[65%] border-t border-white/10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]" />
      </div>
      <div className="relative h-full hidden md:block border-l border-white/5 animate-[fadeInUp_0.8s_ease-out_0.7s_both]">
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 h-[75%] border-t border-white/10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]" />
      </div>
    </div>
  )
}

