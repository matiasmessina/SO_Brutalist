"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Minus } from "lucide-react"
import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

const ease = [0.22, 1, 0.36, 1] as const

/* ── número que se revuelve (del pricing del template) ── */
function ScramblePrice({ target, prefix = "$" }: { target: string; prefix?: string }) {
  const [display, setDisplay] = useState(target.replace(/[0-9]/g, "0"))

  useEffect(() => {
    let iterations = 0
    const max = 18
    const interval = setInterval(() => {
      if (iterations >= max) {
        setDisplay(target)
        clearInterval(interval)
        return
      }
      setDisplay(
        target
          .split("")
          .map((ch, i) => {
            if (!/[0-9]/.test(ch)) return ch
            if (iterations > max - 5 && i < iterations - (max - 5)) return ch
            return String(Math.floor(Math.random() * 10))
          })
          .join(""),
      )
      iterations++
    }, 50)
    return () => clearInterval(interval)
  }, [target])

  return (
    <span className="font-mono font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {display}
    </span>
  )
}

interface Option {
  id: string
  name: string
  price: string
  period: string
  tag: string | null
  description: string
  features: { text: string; included: boolean }[]
  href: string
  cta: string
  highlighted: boolean
}

const OPTIONS: Option[] = [
  {
    id: "sel4",
    name: "SEL4",
    price: "0",
    period: "/ licencia GPLv2",
    tag: "ELEGIR SI: AISLAMIENTO",
    description: "Garantía matemática de aislamiento. Se paga en ingeniería e integración, no en licencia.",
    features: [
      { text: "Verificación formal del kernel", included: true },
      { text: "Aislamiento por capacidades", included: true },
      { text: "Tiempo real con MCS (prueba en RISC-V, 2026)", included: true },
      { text: "Código abierto", included: true },
      { text: "Paquete de certificación DO-178C listo", included: false },
      { text: "Ecosistema grande de drivers", included: false },
    ],
    href: "/sel4",
    cta: "Abrir lab seL4",
    highlighted: false,
  },
  {
    id: "vxworks",
    name: "VXWORKS",
    price: "COTIZAR",
    period: "",
    tag: "ELEGIR SI: CERTIFICAR",
    description: "RTOS comercial con casi 40 años de uso, certificaciones listas y soporte del fabricante.",
    features: [
      { text: "Tiempo real duro, 256 prioridades", included: true },
      { text: "Evidencia DO-178C DAL A / ISO 26262 ASIL D", included: true },
      { text: "Sistema de archivos transaccional (HRFS)", included: true },
      { text: "Soporte global de Wind River", included: true },
      { text: "Verificación formal del kernel", included: false },
      { text: "Código abierto", included: false },
    ],
    href: "/vxworks",
    cta: "Abrir lab VxWorks",
    highlighted: true,
  },
  {
    id: "inferno",
    name: "INFERNO",
    price: "0",
    period: "/ licencia MIT",
    tag: "ELEGIR SI: INVESTIGAR",
    description: "Sistema distribuido de Bell Labs. Ideas que siguen vivas en Go y en 9P, pero sin empresa detrás.",
    features: [
      { text: "Todo es un archivo (Styx / 9P)", included: true },
      { text: "Mismo binario Dis en cualquier plataforma", included: true },
      { text: "Corre con 1 MiB de RAM y sin MMU", included: true },
      { text: "Tiempo real duro", included: false },
      { text: "Soporte comercial", included: false },
      { text: "Certificaciones", included: false },
    ],
    href: "/inferno",
    cta: "Abrir lab Inferno",
    highlighted: false,
  },
]

const WINNERS = [
  { factor: "Determinismo temporal", winner: "VxWorks", why: "RTOS maduro con partición temporal certificada" },
  { factor: "Garantía de aislamiento", winner: "seL4", why: "Única prueba matemática a nivel de código" },
  { factor: "Certificación y tiempo de salida", winner: "VxWorks", why: "Paquetes de evidencia del fabricante" },
  { factor: "Soporte y continuidad", winner: "VxWorks", why: "Empresa con soporte global" },
  { factor: "Costo de licencia", winner: "seL4 / Inferno", why: "Gratis; el costo total es otra historia" },
  { factor: "Portabilidad y diseño distribuido", winner: "Inferno", why: "Mismo binario y recursos remotos como locales" },
]

function OptionCard({ option, index }: { option: Option; index: number }) {
  const isQuote = option.price === "COTIZAR"
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.12, duration: 0.6, ease }}
      className={`flex flex-col h-full border-2 border-foreground ${
        option.highlighted ? "bg-foreground text-background" : "bg-background text-foreground"
      }`}
    >
      <div
        className={`flex items-center justify-between px-5 py-3 border-b-2 ${
          option.highlighted ? "border-background/20" : "border-foreground"
        }`}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono">{option.name}</span>
        <div className="flex items-center gap-2">
          {option.tag && (
            <span className="bg-[#ea580c] text-white text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 font-mono">
              {option.tag}
            </span>
          )}
          <span className="text-[10px] tracking-[0.2em] font-mono opacity-50">{String(index + 1).padStart(2, "0")}</span>
        </div>
      </div>

      <div className="px-5 pt-6 pb-4">
        <div className="flex items-baseline gap-2">
          {isQuote ? (
            <span className="text-3xl lg:text-4xl font-mono font-bold tracking-tight">COTIZAR</span>
          ) : (
            <span className="text-3xl lg:text-4xl">
              <ScramblePrice target={option.price} />
            </span>
          )}
          {option.period && (
            <span
              className={`text-xs font-mono tracking-widest uppercase ${
                option.highlighted ? "text-background/50" : "text-muted-foreground"
              }`}
            >
              {option.period}
            </span>
          )}
        </div>
        <p
          className={`text-xs font-mono mt-3 leading-relaxed ${
            option.highlighted ? "text-background/70" : "text-muted-foreground"
          }`}
        >
          {option.description}
        </p>
      </div>

      <div
        className={`flex-1 px-5 py-4 border-t-2 ${option.highlighted ? "border-background/20" : "border-foreground"}`}
      >
        <div className="flex flex-col gap-3">
          {option.features.map((f, fi) => (
            <motion.div
              key={f.text}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 + 0.3 + fi * 0.04, duration: 0.35, ease }}
              className="flex items-start gap-3"
            >
              {f.included ? (
                <Check size={12} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#ea580c]" />
              ) : (
                <Minus
                  size={12}
                  strokeWidth={2}
                  className={`mt-0.5 shrink-0 ${option.highlighted ? "text-background/30" : "text-muted-foreground/40"}`}
                />
              )}
              <span
                className={`text-xs font-mono leading-relaxed ${
                  f.included
                    ? ""
                    : option.highlighted
                      ? "text-background/40 line-through"
                      : "text-muted-foreground/50 line-through"
                }`}
              >
                {f.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 pt-3">
        <Link
          href={option.href}
          className={`group w-full flex items-center justify-center gap-0 text-xs font-mono tracking-wider uppercase ${
            option.highlighted ? "bg-background text-foreground" : "bg-foreground text-background"
          }`}
        >
          <span className="flex items-center justify-center w-9 h-9 bg-[#ea580c]">
            <ArrowRight size={14} strokeWidth={2} className="text-white" />
          </span>
          <span className="flex-1 py-2.5 text-center">{option.cta}</span>
        </Link>
      </div>
    </motion.div>
  )
}

export function ComparisonSection() {
  return (
    <section id="comparativa" className="w-full px-6 py-20 lg:px-12 scroll-mt-6">
      <SectionLabel label="// SECTION: COMPARATIVA" index="003" blink />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12"
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-foreground text-balance">
            ¿Cuál conviene? Depende de qué manda
          </h2>
          <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-xl">
            No hay un ganador universal. seL4 y VxWorks compiten en sistemas embebidos críticos; Inferno juega en otra
            liga y sirve como contraste de diseño.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-widest text-muted-foreground uppercase font-mono">
          <span className="h-1.5 w-1.5 bg-[#ea580c]" />
          <span>Recomendación por escenario, no por ranking</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {OPTIONS.map((o, i) => (
          <OptionCard key={o.id} option={o} index={i} />
        ))}
      </div>

      {/* Quién gana en cada factor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease }}
        className="mt-10 border-2 border-foreground"
      >
        <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
          <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">ganador_por_factor.tbl</span>
          <span className="text-[10px] tracking-widest text-muted-foreground font-mono">SEGMENTO: EMBEBIDOS CRÍTICOS</span>
        </div>
        <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_1.6fr] gap-4 px-4 py-2 border-b border-border">
          {["Factor", "Gana", "Por qué"].map((h) => (
            <span key={h} className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono">
              {h}
            </span>
          ))}
        </div>
        {WINNERS.map((w) => (
          <div
            key={w.factor}
            className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr_1.6fr] gap-1 md:gap-4 px-4 py-3 border-b border-border last:border-none"
          >
            <span className="text-xs font-mono text-foreground">{w.factor}</span>
            <span className="text-xs font-mono font-bold text-[#ea580c] uppercase">{w.winner}</span>
            <span className="text-xs font-mono text-muted-foreground">{w.why}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5, ease }}
        className="flex items-center gap-3 mt-6"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          {"* Licencia gratis ≠ proyecto barato: en sistemas críticos el costo dominante es ingeniería y certificación."}
        </span>
        <div className="flex-1 border-t border-border" />
      </motion.div>
    </section>
  )
}
