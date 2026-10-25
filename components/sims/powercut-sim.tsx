"use client"

import { useState } from "react"
import { Power, RotateCcw, Save, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  FAT_STEPS,
  HRFS_STEPS,
  TOTAL_TICKS,
  diskAt,
  recoverFat,
  recoverHrfs,
  type Block,
  type Recovery,
  type StepStatus,
} from "@/lib/sims/powercut"
import { SimToolbar, SimWindow } from "@/components/sim/sim-window"
import { CtrlButton, TickBadge } from "@/components/sim/controls"
import { useTicker } from "@/components/sim/use-ticker"

type Phase = "idle" | "writing" | "cut" | "recovered" | "complete"

const BLOCK_CLASS: Record<Block["kind"], string> = {
  free: "border border-border text-transparent",
  meta: "bg-foreground text-background",
  other: "bg-muted text-muted-foreground",
  v1: "border-2 border-foreground text-foreground",
  v2: "bg-[#ea580c] text-white",
  writing: "border-2 border-[#ea580c] text-[#ea580c] animate-pulse",
  torn: "hatch-accent text-foreground",
  stale: "border border-dashed border-border text-muted-foreground",
}

const LEGEND: { kind: Block["kind"]; label: string }[] = [
  { kind: "meta", label: "Metadatos" },
  { kind: "v1", label: "Datos v1" },
  { kind: "v2", label: "Datos v2" },
  { kind: "torn", label: "Bloque a medio escribir" },
  { kind: "other", label: "Otros archivos" },
  { kind: "free", label: "Libre" },
]

function StepMark({ st }: { st: StepStatus }) {
  if (st === "done") return <span className="text-[#ea580c] font-bold">✓</span>
  if (st === "active") return <span className="text-[#ea580c] animate-blink">▶</span>
  if (st === "interrupted") return <span className="text-[#ea580c] font-bold">✕</span>
  return <span className="text-muted-foreground">·</span>
}

function Disk({
  name,
  strategy,
  fs,
  ticks,
  cut,
  phase,
  recovery,
}: {
  name: string
  strategy: string
  fs: "fat" | "hrfs"
  ticks: number
  cut: boolean
  phase: Phase
  recovery: Recovery | null
}) {
  const disk = diskAt(fs, ticks, cut)
  const steps = fs === "fat" ? FAT_STEPS : HRFS_STEPS
  const tone = recovery?.verdict
  const bad = tone === "corrupt" || tone === "inconsistent"

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wide">{name}</span>
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">{strategy}</span>
      </div>

      {/* Disco */}
      <div className="relative p-4">
        <div className="grid grid-cols-8 gap-1">
          {disk.blocks.map((b, i) => (
            <div
              key={i}
              className={cn("h-9 flex items-center justify-center text-[8px] sm:text-[9px] font-mono uppercase", BLOCK_CLASS[b.kind])}
              title={`Bloque ${i}`}
            >
              {b.label}
            </div>
          ))}
        </div>
        {phase === "cut" && (
          <div className="absolute inset-0 bg-foreground/90 flex flex-col items-center justify-center gap-2">
            <Zap className="text-[#ea580c]" size={28} />
            <span className="font-pixel text-2xl text-background">SIN ENERGÍA</span>
          </div>
        )}
      </div>

      {/* Pasos */}
      <ol className="flex flex-col gap-1.5 px-4 pb-4">
        {steps.map((s, i) => (
          <li key={s.text} className="flex items-start gap-3 text-[11px] font-mono leading-relaxed">
            <span className="w-3 shrink-0 text-center">
              <StepMark st={disk.steps[i]} />
            </span>
            <span className={cn(disk.steps[i] === "pending" ? "text-muted-foreground" : "text-foreground")}>{s.text}</span>
          </li>
        ))}
      </ol>

      {/* Lectura tras reiniciar */}
      <div className="mt-auto border-t-2 border-foreground">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">cat config.dat</span>
          {recovery && (
            <span
              className={cn(
                "text-[9px] tracking-[0.15em] uppercase font-mono px-2 py-0.5",
                bad ? "bg-[#ea580c] text-white" : "bg-foreground text-background",
              )}
            >
              {recovery.title}
            </span>
          )}
        </div>
        <div className="bg-foreground px-4 py-3 min-h-[64px]">
          <span className="text-xs font-mono text-background break-words">
            {recovery
              ? recovery.readback
              : phase === "complete"
                ? "MODO=ATERRIZAR  VEL=080  ALT=0500"
                : "MODO=CRUCERO  VEL=120  ALT=3000"}
          </span>
        </div>
        {recovery && <p className="px-4 py-3 text-[11px] font-mono text-muted-foreground leading-relaxed">{recovery.detail}</p>}
      </div>
    </div>
  )
}

export function PowerCutSim() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [ticks, setTicks] = useState(0)

  useTicker(phase === "writing", 380, () => {
    const n = ticks + 1
    setTicks(n)
    if (n >= TOTAL_TICKS) setPhase("complete")
  })

  const start = () => {
    setTicks(0)
    setPhase("writing")
  }
  const cut = () => setPhase("cut")
  const recover = () => setPhase("recovered")
  const reset = () => {
    setPhase("idle")
    setTicks(0)
  }

  const isCut = phase === "cut" || phase === "recovered"
  const fatRec = phase === "recovered" ? recoverFat(ticks) : null
  const hrfsRec = phase === "recovered" ? recoverHrfs(ticks) : null

  return (
    <SimWindow title="powercut.vxworks" right={<TickBadge t={ticks} />}>
      <SimToolbar>
        <div className="flex flex-wrap items-center gap-2">
          <CtrlButton variant="solid" onClick={start} disabled={phase === "writing" || phase === "cut"}>
            <Save size={12} />
            Guardar config.dat
          </CtrlButton>
          <CtrlButton variant="accent" onClick={cut} disabled={phase !== "writing"}>
            <Zap size={12} />
            Cortar la luz
          </CtrlButton>
          <CtrlButton onClick={recover} disabled={phase !== "cut"}>
            <Power size={12} />
            Encender y montar
          </CtrlButton>
          <CtrlButton onClick={reset}>
            <RotateCcw size={12} />
            Reiniciar
          </CtrlButton>
        </div>
        <span className="text-[10px] tracking-widest uppercase font-mono text-muted-foreground">
          {phase === "idle" && "Listo para guardar"}
          {phase === "writing" && "Escribiendo… cortá cuando quieras"}
          {phase === "cut" && "Corte de energía · encendé para ver qué quedó"}
          {phase === "recovered" && "Volumen montado de nuevo"}
          {phase === "complete" && "Guardado sin cortes · probá cortar a la mitad"}
        </span>
      </SimToolbar>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="border-b-2 lg:border-b-0 lg:border-r-2 border-foreground flex">
          <Disk
            name="dosFs (FAT)"
            strategy="escribe en el lugar"
            fs="fat"
            ticks={ticks}
            cut={isCut}
            phase={phase}
            recovery={fatRec}
          />
        </div>
        <div className="flex">
          <Disk
            name="HRFS"
            strategy="copy-on-write + commit"
            fs="hrfs"
            ticks={ticks}
            cut={isCut}
            phase={phase}
            recovery={hrfsRec}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t-2 border-foreground px-4 py-3">
        {LEGEND.map((l) => (
          <span key={l.kind} className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className={cn("inline-block h-3 w-3", BLOCK_CLASS[l.kind])} />
            {l.label}
          </span>
        ))}
      </div>
    </SimWindow>
  )
}
