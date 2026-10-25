"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { ScrambleNumber } from "@/components/scramble"

const ease = [0.22, 1, 0.36, 1] as const

export interface OsHeroProps {
  code: string
  index: string
  pixelTitle: string
  tagline: string
  description: string
  facts: { label: string; value: string }[]
  metrics: { value: string; label: string }[]
  sims: { id: string; label: string }[]
}

export function OsHero({ code, index, pixelTitle, tagline, description, facts, metrics, sims }: OsHeroProps) {
  return (
    <section className="w-full px-6 pt-10 pb-8 lg:px-12">
      <SectionLabel label={`// ${code}`} index={index} blink />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] border-2 border-foreground">
        {/* Izquierda: título y descripción */}
        <div className="flex flex-col gap-6 p-6 lg:p-10 border-b-2 lg:border-b-0 lg:border-r-2 border-foreground">
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease }}
            className="font-pixel text-6xl sm:text-7xl lg:text-8xl tracking-tight text-foreground select-none"
          >
            {pixelTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease }}
            className="text-xs lg:text-sm font-mono uppercase tracking-[0.15em] text-[#ea580c]"
          >
            {tagline}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
            className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-2xl"
          >
            {description}
          </motion.p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {sims.map((s) => (
              <Link
                key={s.id}
                href={`#${s.id}`}
                className="group inline-flex items-center gap-0 bg-foreground text-background text-[10px] font-mono tracking-[0.15em] uppercase"
              >
                <span className="flex items-center justify-center w-8 h-8 bg-[#ea580c]">
                  <ArrowDown size={12} className="text-white" />
                </span>
                <span className="px-3 py-2">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Derecha: ficha técnica */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">ficha_tecnica.sys</span>
            <span className="inline-block h-2 w-2 bg-[#ea580c]" />
          </div>
          <div className="flex-1 flex flex-col px-4 py-2">
            {facts.map((f) => (
              <div key={f.label} className="grid grid-cols-[110px_1fr] gap-3 py-3 border-b border-border last:border-none">
                <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono pt-0.5">{f.label}</span>
                <span className="text-xs font-mono text-foreground leading-relaxed">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-t-0 border-foreground">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`p-5 lg:p-6 ${i % 2 === 1 ? "border-l-2" : ""} ${i >= 2 ? "border-t-2 md:border-t-0" : ""} ${
              i === 2 ? "md:border-l-2" : ""
            } border-foreground`}
          >
            <ScrambleNumber target={m.value} label={m.label} delay={200 + i * 150} size="md" />
          </div>
        ))}
      </div>
    </section>
  )
}
