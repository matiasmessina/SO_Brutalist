"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { SectionLabel } from "@/components/section-label"
import { TerminalCard } from "@/components/bento/terminal-card"

const ease = [0.22, 1, 0.36, 1] as const

const SEL4_LINES = [
  "> RADIO comprometida por paquete malformado",
  "> RADIO: seL4_Call(cap=0x0b) → MOTORES",
  "> seL4: seL4_InvalidCapability",
  "> RADIO: leer 0x4000_0000 (VUELO)",
  "> seL4: fallo de página → manejador de RADIO",
  "> CONTROL DE VUELO: intacto",
  "> --------- AISLAMIENTO OK ---------",
]

const VXWORKS_LINES = [
  "> t=01 ASI/MET: semTake(infoBus) ok",
  "> t=02 bc_dist (prio 10) desaloja a ASI/MET",
  "> t=03 bc_dist: semTake → BLOQUEADA",
  "> t=03 comm (prio 50) toma la CPU",
  "> t=14 bc_sched: bc_dist no terminó",
  "> t=14 RESET DEL SISTEMA",
  "> --------- MARS PATHFINDER, 1997 ---------",
]

const INFERNO_LINES = [
  "; mount tcp!lab!styx /n/lab",
  "Tversion → Rversion 9P2000",
  "Tattach  → Rattach",
  "; cat /n/lab/dev/sensor/temp",
  "Twalk · Topen · Tread · Tclunk",
  "23.7 °C",
  "; --------- TODO ES UN ARCHIVO ---------",
]

const LABS = [
  {
    href: "/sel4",
    code: "LAB_01",
    file: "sel4.lab",
    name: "seL4",
    kind: "Microkernel verificado",
    pitch: "El único kernel de propósito general con una prueba matemática de que aísla a las aplicaciones entre sí.",
    sims: ["Hackeá el dron: capacidades vs kernel monolítico", "Presupuesto de CPU con MCS"],
    lines: SEL4_LINES,
    term: "capabilities.log",
  },
  {
    href: "/vxworks",
    code: "LAB_02",
    file: "vxworks.lab",
    name: "VxWorks",
    kind: "RTOS comercial",
    pitch: "El sistema de tiempo real de los rovers de Marte, el Boeing 787 y los robots industriales.",
    sims: ["Mars Pathfinder: inversión de prioridades", "Corte de luz: FAT vs HRFS"],
    lines: VXWORKS_LINES,
    term: "pathfinder.log",
  },
  {
    href: "/inferno",
    code: "LAB_03",
    file: "inferno.lab",
    name: "Inferno",
    kind: "SO distribuido · Bell Labs",
    pitch: "Todo recurso es un archivo y cualquier máquina de la red se monta como una carpeta.",
    sims: ["Shell con namespaces por proceso", "Visor de mensajes 9P / Styx"],
    lines: INFERNO_LINES,
    term: "styx.log",
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease },
  }),
}

export function LabsSection() {
  return (
    <section id="laboratorios" className="w-full px-6 py-20 lg:px-12 scroll-mt-6">
      <SectionLabel label="// SECTION: LABORATORIOS" index="001" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease }}
        className="flex flex-col gap-3 mb-10"
      >
        <h2 className="text-2xl lg:text-3xl font-mono font-bold tracking-tight uppercase text-foreground text-balance">
          Seis simulaciones, tres sistemas
        </h2>
        <p className="text-xs lg:text-sm font-mono text-muted-foreground leading-relaxed max-w-2xl">
          Cada laboratorio toma las dos ideas que mejor distinguen a ese sistema y las convierte en algo que se puede
          tocar: romper un componente, cortar la luz, montar otra máquina. Todas comparan contra lo que haría un sistema
          operativo convencional.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 lg:grid-cols-3 border-2 border-foreground"
      >
        {LABS.map((lab, i) => (
          <motion.div
            key={lab.href}
            custom={i}
            variants={cardVariants}
            className={`flex flex-col ${i > 0 ? "border-t-2 lg:border-t-0 lg:border-l-2" : ""} border-foreground`}
          >
            <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
              <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">{lab.file}</span>
              <span className="text-[10px] tracking-widest text-muted-foreground font-mono">{lab.code}</span>
            </div>

            <div className="flex flex-col gap-3 p-5">
              <span className="font-pixel text-4xl lg:text-5xl text-foreground">{lab.name}</span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#ea580c] font-mono">{lab.kind}</span>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed min-h-[54px]">{lab.pitch}</p>
            </div>

            <div className="border-t-2 border-foreground">
              <TerminalCard lines={lab.lines} title={lab.term} speed={900} />
            </div>

            <div className="flex-1 flex flex-col gap-3 border-t-2 border-foreground p-5">
              {lab.sims.map((s, si) => (
                <div key={s} className="flex items-start gap-3">
                  <span className="text-[10px] font-mono text-[#ea580c] font-bold pt-0.5">
                    SIM {String(i * 2 + si + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-mono text-foreground leading-relaxed">{s}</span>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              <Link
                href={lab.href}
                className="group w-full flex items-center gap-0 bg-foreground text-background text-xs font-mono tracking-wider uppercase hover:bg-foreground/85 transition-colors"
              >
                <span className="flex items-center justify-center w-9 h-9 bg-[#ea580c]">
                  <ArrowRight size={14} strokeWidth={2} className="text-white" />
                </span>
                <span className="flex-1 py-2.5 text-center">Abrir laboratorio</span>
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
