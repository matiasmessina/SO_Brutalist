"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const SOURCES = [
  { href: "https://sel4.systems", label: "sel4.systems" },
  { href: "https://www.windriver.com/products/embedded/vxworks", label: "windriver.com" },
  { href: "https://github.com/inferno-os/inferno-os", label: "inferno-os" },
]

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className="w-full border-t-2 border-foreground px-6 py-8 lg:px-12"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-foreground">SO.LAB</span>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            TP Especial · Evaluación de producto · Sistemas Operativos · 2026
          </span>
          <span className="text-[10px] font-mono tracking-wider text-muted-foreground max-w-xl leading-relaxed mt-2">
            Las simulaciones son modelos didácticos simplificados: muestran el comportamiento de cada sistema, no lo emulan.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {[{ href: "/sel4", label: "seL4" }, { href: "/vxworks", label: "VxWorks" }, { href: "/inferno", label: "Inferno" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <span className="hidden md:inline-block h-4 border-l border-border" />
          {SOURCES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>
    </motion.footer>
  )
}
