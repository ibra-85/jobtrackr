"use client"

import Link from "next/link"
import { ArrowRight, FileText, Sparkles, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedGroup } from "@/components/ui/animated-group"

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
}

export function HeroContent() {
  return (
    <section>
      <div className="relative pt-24 md:pt-36">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,rgb(9,9,11)_75%)]"
        />
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
            <AnimatedGroup variants={transitionVariants}>
              <Link
                href="#features"
                className="hover:bg-zinc-900 bg-zinc-900/50 group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 p-1 pl-4 shadow-md shadow-black/20 transition-all duration-300"
              >
                <span className="text-zinc-200 text-sm">Propulsé par l'IA générative</span>
                <span className="block h-4 w-0.5 border-l border-zinc-700 bg-zinc-700"></span>
                <div className="bg-zinc-800 group-hover:bg-zinc-700 size-6 overflow-hidden rounded-full duration-500">
                  <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-3 text-white" />
                    </span>
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-3 text-white" />
                    </span>
                  </div>
                </div>
              </Link>
              <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl md:text-6xl lg:mt-16 xl:text-7xl font-bold bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                Créez des CV et lettres de motivation parfaits avec l'IA
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-zinc-400">
                Générez des CV professionnels et des lettres de motivation personnalisées en quelques secondes.
                Notre IA analyse les offres d'emploi et optimise vos candidatures pour maximiser vos chances.
              </p>
            </AnimatedGroup>
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
              className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
            >
              <div
                key={1}
                className="bg-white/10 rounded-[14px] border border-white/20 p-0.5 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 h-10 text-base font-medium bg-white text-zinc-900 hover:bg-zinc-200 transition-colors"
                >
                  <Sparkles className="size-4" />
                  <span className="text-nowrap">Créer mon CV gratuitement</span>
                </Link>
              </div>
              <Button
                key={2}
                asChild
                size="lg"
                variant="ghost"
                className="h-10.5 rounded-xl px-5 text-zinc-300 hover:text-white hover:bg-white/10"
              >
                <Link href="#templates">
                  <FileText className="mr-2 size-4" />
                  <span className="text-nowrap">Voir les modèles</span>
                </Link>
              </Button>
            </AnimatedGroup>
          </div>
        </div>
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.75,
                },
              },
            },
            ...transitionVariants,
          }}
        >
          <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
            <div
              aria-hidden
              className="bg-gradient-to-b to-zinc-950 absolute inset-0 z-10 from-transparent from-35%"
            />
            <div className="ring-white/10 bg-zinc-900 relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 p-4 shadow-lg shadow-black/50 ring-1">
              <div className="bg-zinc-900 aspect-15/8 relative rounded-2xl flex items-center justify-center">
                <div className="text-center text-zinc-500">
                  <Briefcase className="h-24 w-24 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Aperçu de l'interface JobTrackr</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedGroup>
      </div>
    </section>
  )
}

