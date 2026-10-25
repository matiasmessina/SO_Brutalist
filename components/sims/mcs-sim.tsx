"use client"

import { useMemo, useState } from "react"
import { Bug } from "lucide-react"
import { cn } from "@/lib/utils"
import { HORIZON, MCS_TASKS, PERIOD, simulateMcs } from "@/lib/sims/mcs"
import { SimLog, SimToolbar, SimWindow } from "@/components/sim/sim-window"
import { CtrlButton, PlayControls, Segmented, TickBadge } from "@/components/sim/controls"
import { Gantt, GanttLegend, type GanttMarker } from "@/components/sim/gantt"
import { useTicker } from "@/components/sim/use-ticker"

type Mode = "sin" | "con"

export function McsSim() {
  const [mode, setMode] = useState<Mode>("con")
  const [bugAt, setBugAt] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const mcs = mode === "con"
  const frames = useMemo(() => simulateMcs(mcs, bugAt), [mcs, bugAt])
  const finished = step >= HORIZON
  const current = step - 1
  const revealed = frames.slice(0, step)

  const advance = () => {
    if (step >= HORIZON) {
      setPlaying(false)
      return
    }
    const n = step + 1
    setStep(n)
    if (n >= HORIZON) setPlaying(false)
  }
  useTicker(playing, 300, advance)

  const reset = () => {
    setPlaying(false)
    setStep(0)
    setBugAt(null)
  }
  const changeMode = (m: Mode) => {
    setMode(m)
    reset()
  }
  const injectBug = () => setBugAt(Math.max(step, 1))

  const misses = (id: string) => revealed.filter((f) => f.misses.includes(id)).length
  const navRuns = revealed.filter((f) => f.cells.nav === "run").length
  const navShare = step > 0 ? Math.round((navRuns / step) * 100) : 0

  const markers: GanttMarker[] = [
    ...[1, 2, 3].map((p) => ({ t: p * PERIOD, label: `período ${p + 1}` })),
    ...(bugAt !== null ? [{ t: bugAt, label: "bug", tone: "accent" as const }] : []),
  ]

  const rows = [
    ...MCS_TASKS.map((t) => ({ id: t.id, label: t.name, sub: t.role })),
    { id: "budget", label: "PRESUP. NAV", sub: mcs ? "ms que le quedan" : "sin límite" },
  ]

  const events = revealed.flatMap((f) => f.events)

  return (
    <SimWindow title="mcs.sel4" right={<TickBadge t={Math.max(current, 0)} unit="ms" />}>
      <SimToolbar>
        <Segmented<Mode>
          label="Planificador"
          value={mode}
          onChange={changeMode}
          options={[
            { value: "sin", label: "Solo prioridades" },
            { value: "con", label: "MCS · presupuestos" },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <CtrlButton variant="accent" onClick={injectBug} disabled={bugAt !== null || finished}>
            <Bug size={12} />
            Inyectar bucle infinito
          </CtrlButton>
          <PlayControls
            playing={playing}
            onToggle={() => setPlaying((p) => !p)}
            onStep={advance}
            onReset={reset}
            finished={finished}
          />
        </div>
      </SimToolbar>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5 p-4 lg:p-6 xl:border-r-2 border-foreground">
          <Gantt
            rows={rows}
            horizon={HORIZON}
            current={current}
            markers={markers}
            cellAt={(id, t) => (id === "budget" || t >= step ? null : (frames[t]?.cells[id] ?? null))}
            missesAt={(id, t) => t + 1 < step && t + 1 < HORIZON && (frames[t + 1]?.misses.includes(id) ?? false)}
            cellLabel={(id, t) => {
              if (id !== "budget" || t >= step) return null
              return mcs ? String(frames[t].budget.nav) : "∞"
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <GanttLegend items={["run", "ready", "throttled"]} />
            <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <span className="text-[#ea580c] font-bold text-sm leading-none">✕</span>
              Plazo perdido
            </span>
          </div>
        </div>

        <div className="flex flex-col border-t-2 xl:border-t-0 border-foreground">
          <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">plazos.status</span>
            <span className="text-[10px] tracking-widest text-muted-foreground font-mono">255 = MÁS ALTA</span>
          </div>
          <div className="grid grid-cols-2 border-b-2 border-foreground">
            <div className="p-4 border-r-2 border-foreground">
              <span className={cn("text-3xl font-mono font-bold", misses("ctrl") > 0 ? "text-[#ea580c]" : "text-foreground")}>
                {misses("ctrl")}
              </span>
              <span className="block text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono mt-1">
                Plazos perdidos CONTROL
              </span>
            </div>
            <div className="p-4">
              <span className={cn("text-3xl font-mono font-bold", misses("tele") > 0 ? "text-[#ea580c]" : "text-foreground")}>
                {misses("tele")}
              </span>
              <span className="block text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono mt-1">
                Plazos perdidos TELEMETRÍA
              </span>
            </div>
          </div>
          <div className="p-4 border-b-2 border-foreground">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono">CPU usada por NAVEGACIÓN</span>
              <span className="text-[11px] font-mono text-foreground">{navShare}%</span>
            </div>
            <div className="h-2 w-full border border-foreground">
              <div className={cn("h-full", navShare > 30 ? "bg-[#ea580c]" : "bg-foreground")} style={{ width: `${navShare}%` }} />
            </div>
            <span className="block text-[10px] font-mono text-muted-foreground mt-2">
              {mcs ? "Tope por contrato: 20% (2 ms cada 10 ms)" : "Sin tope: puede llegar al 100%"}
            </span>
          </div>
          <div className="px-4 py-2 border-b-2 border-foreground text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
            configuracion.c
          </div>
          <pre className="bg-foreground text-background text-[11px] font-mono p-4 overflow-x-auto leading-relaxed">
            {mcs
              ? "/* NAVEGACIÓN: 2 ms cada 10 ms */\nseL4_SchedControl_Configure(\n    sched_control, nav_sc,\n    2 * US_IN_MS,  /* budget */\n    10 * US_IN_MS, /* period */\n    0, 0);"
              : "/* sin MCS: la prioridad más\n   alta corre mientras quiera */\nseL4_TCB_SetPriority(\n    nav_tcb, auth, 250);"}
          </pre>
          <p className="px-4 py-3 text-[10px] font-mono text-muted-foreground leading-relaxed">
            Llamadas simplificadas de la API de seL4. MCS se activa al compilar el kernel con KernelIsMCS.
          </p>
        </div>
      </div>

      <div className="border-t-2 border-foreground">
        <SimLog lines={events} title="mcs.log" empty="> tres tareas periódicas de 10 ms. todo cumple sus plazos." />
      </div>
    </SimWindow>
  )
}
