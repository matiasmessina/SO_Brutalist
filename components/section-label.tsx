"use client"

import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

/** Rótulo de sección del template: "// SECTION: X ———— 004". */
export function SectionLabel({ label, index, blink = false }: { label: string; index?: string; blink?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease }}
      className="flex items-center gap-4 mb-8"
    >
      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">{label}</span>
      <div className="flex-1 border-t border-border" />
      {blink && <span className="inline-block h-2 w-2 bg-[#ea580c] animate-blink" />}
      {index && (
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">{index}</span>
      )}
    </motion.div>
  )
}
