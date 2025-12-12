"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function TrustedBySection() {
  const companies = [
    "TechCorp",
    "StartupHub",
    "InnovateLab",
    "DevStudio",
    "CodeFlow",
    "WebAgency",
    "DataTech",
    "CloudSoft",
  ]

  return (
    <section className="bg-zinc-950 pb-16 pt-16 md:pb-32">
      <div className="group relative m-auto max-w-5xl px-6">
        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
          <Link href="/" className="block text-sm text-white duration-150 hover:opacity-75">
            <span>Ils nous font confiance</span>
            <ChevronRight className="ml-1 inline-block size-3" />
          </Link>
        </div>
        <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
                      {companies.map((company) => (
                        <div key={company} className="flex">
              <div className="mx-auto h-5 w-fit text-zinc-500 text-xs font-semibold">{company}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

