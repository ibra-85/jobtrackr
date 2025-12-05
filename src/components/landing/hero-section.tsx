"use client"

import { AnimatedGridBackground } from "./animated-grid-background"
import { AuraBackground } from "./aura-background"
import { HeroShaderBackground } from "./hero-shader-background"
import { HeroHeader } from "./hero-header"
import { HeroContent } from "./hero-content"
import { TrustedBySection } from "./trusted-by-section"

export function HeroSection() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden" style={{ backgroundColor: "#09090b" }}>
      {/* WebGL shader background - behind everything */}
      <HeroShaderBackground />

      {/* Animated grid columns*/}
      <AnimatedGridBackground />

      {/* Aura light effects - above grid */}
      <AuraBackground />

      <HeroHeader />

      <main className="overflow-hidden relative z-[2]">
        <HeroContent />
        <TrustedBySection />
      </main>
    </div>
  )
}
