"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

const ease = [0.22, 1, 0.36, 1] as const

export interface Takeaway {
  label: string
  text: string
}

/** Sección de una simulación: rótulo, título, cómo usarla, el simulador y las conclusiones. */
export function SimSection({
  id,
  label,
  index,
  title,
  intro,
  howTo,
  children,
  takeaways,
}: {
  id: string
  label: string
  index: string
  title: string
  intro: ReactNode
  howTo?: string[]
  children: ReactNode
  takeaways: Takeaway[]
}) {
  return (
    <section id={id} className="w-full px-6 py-14 lg:px-12 scroll-mt-6">
      <SectionLabel label={label} index={index} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-12 mb-8"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-foreground text-balance">
            {title}
          </h2>
          <div className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-2xl flex flex-col gap-3">
            {intro}
          </div>
        </div>
        {howTo && (
          <div className="border-2 border-foreground self-start">
            <div className="px-4 py-2 border-b-2 border-foreground text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
              como_usarlo.txt
            </div>
            <ol className="flex flex-col gap-2 p-4">
              {howTo.map((h, i) => (
                <li key={h} className="flex gap-3 text-xs font-mono text-foreground leading-relaxed">
                  <span className="text-[#ea580c] font-bold shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span>{h}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
      >
        {children}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 border-2 border-t-0 border-foreground">
        {takeaways.map((t, i) => (
          <div
            key={t.label}
            className={`flex flex-col gap-2 p-5 ${i > 0 ? "border-t-2 md:border-t-0 md:border-l-2" : ""} border-foreground`}
          >
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#ea580c] font-mono">{t.label}</span>
            <p className="text-xs font-mono text-foreground leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
