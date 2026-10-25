"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { DEADLINE, HORIZON, TASKS, simulatePathfinder, type PfCell } from "@/lib/sims/pathfinder"
import { SimLog, SimToolbar, SimWindow } from "@/components/sim/sim-window"
import { PlayControls, Segmented, TickBadge } from "@/components/sim/controls"
import { Gantt, GanttLegend } from "@/components/sim/gantt"
import { useTicker } from "@/components/sim/use-ticker"

const STATE_LABEL: Record<PfCell, string> = {
  empty: "Sin llegar",
  run: "Ejecutando",
  cs: "Ejecutando · mutex",
  boost: "Ejecutando · prio heredada",
  ready: "Lista",
  blocked: "Bloqueada",
  done: "Terminó",
}

type Mode = "sin" | "con"

export function PathfinderSim() {
  const [mode, setMode] = useState<Mode>("sin")
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const frames = useMemo(() => simulatePathfinder(mode === "con"), [mode])
  const finished = step >= frames.length
  const current = step - 1
  const frame = current >= 0 ? frames[current] : null
  const revealed = frames.slice(0, step)
  const didReset = revealed.some((f) => f.reset)
  const bcDoneAt = revealed.findIndex((f) => f.events.some((e) => e.text.endsWith("bc_dist terminó")))
  const cycleOk = revealed.some((f) => f.t >= DEADLINE && !f.reset)

  const advance = () => {
    if (step >= frames.length) {
      setPlaying(false)
      return
    }
    const n = step + 1
    setStep(n)
    if (n >= frames.length) setPlaying(false)
  }
  useTicker(playing, 650, advance)

  const reset = () => {
    setPlaying(false)
    setStep(0)
  }

  const changeMode = (m: Mode) => {
    setMode(m)
    setPlaying(false)
    setStep(0)
  }

  const events = revealed.flatMap((f) => f.events)

  return (
    <SimWindow title="pathfinder.vxworks" right={<TickBadge t={Math.max(current, 0)} />}>
      <SimToolbar>
        <Segmented<Mode>
          label="Mutex infoBus"
          value={mode}
          onChange={changeMode}
          options={[
            { value: "sin", label: "Sin herencia (1997)" },
            { value: "con", label: "Con herencia (el parche)" },
          ]}
        />
        <PlayControls
          playing={playing}
          onToggle={() => (finished ? reset() : setPlaying((p) => !p))}
          onStep={advance}
          onReset={reset}
          finished={finished}
        />
      </SimToolbar>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px]">
        {/* Línea de tiempo */}
        <div className="flex flex-col gap-5 p-4 lg:p-6 xl:border-r-2 border-foreground">
          <div>
            <Gantt
              rows={TASKS.map((t) => ({ id: t.id, label: t.name, sub: `prio ${t.prio} · ${t.role}` }))}
              horizon={HORIZON}
              current={current}
              cellAt={(id, t) => (t < step ? (frames[t]?.cells[id] ?? null) : null)}
              markers={[{ t: DEADLINE, label: "watchdog bc_sched", tone: "accent" }]}
            />
          </div>
          <GanttLegend items={["run", "cs", "boost", "ready", "blocked"]} />

          {/* Resultado */}
          {didReset && (
            <div className="border-2 border-[#ea580c] bg-[#ea580c] text-white p-4 flex flex-col gap-1">
              <span className="font-pixel text-2xl lg:text-3xl">RESET DEL SISTEMA</span>
              <span className="text-xs font-mono leading-relaxed">
                bc_dist (la tarea más importante) no terminó antes del watchdog. Es lo que le pasó al Mars Pathfinder en
                Marte en julio de 1997: el rover se reiniciaba solo y perdía el trabajo en curso.
              </span>
            </div>
          )}
          {cycleOk && (
            <div className="border-2 border-foreground bg-foreground text-background p-4 flex flex-col gap-1">
              <span className="font-pixel text-2xl lg:text-3xl">CICLO OK</span>
              <span className="text-xs font-mono leading-relaxed">
                Con herencia de prioridad, ASI/MET sube a prioridad 10 mientras tiene el mutex, lo suelta rápido y bc_dist
                termina en t={String(bcDoneAt).padStart(2, "0")}, mucho antes del watchdog.
              </span>
            </div>
          )}
          {!didReset && !cycleOk && (
            <div className="border-2 border-dashed border-border p-4 text-xs font-mono text-muted-foreground leading-relaxed">
              {step === 0
                ? "Apretá Reproducir o Paso. Las tres tareas comparten el mutex infoBus; mirá qué pasa cuando llega comm."
                : "Seguí avanzando: el watchdog revisa en t=14 si bc_dist terminó."}
            </div>
          )}
        </div>

        {/* Estado del sistema */}
        <div className="flex flex-col border-t-2 xl:border-t-0 border-foreground">
          <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">tareas.status</span>
            <span className="text-[10px] tracking-widest text-muted-foreground font-mono">0 = MÁS ALTA</span>
          </div>
          <div className="flex flex-col px-4 py-2">
            <div className="grid grid-cols-[1fr_1.2fr_56px] gap-2 border-b border-border pb-2 mb-1">
              {["Tarea", "Estado", "Prio"].map((h) => (
                <span key={h} className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono">
                  {h}
                </span>
              ))}
            </div>
            {TASKS.map((t) => {
              const st: PfCell = frame?.cells[t.id] ?? "empty"
              const eff = frame?.eff[t.id] ?? t.prio
              const boosted = eff !== t.prio
              return (
                <div key={t.id} className="grid grid-cols-[1fr_1.2fr_56px] gap-2 py-2 border-b border-border last:border-none">
                  <span className="text-xs font-mono text-foreground">{t.name}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0",
                        st === "blocked" ? "bg-[#ea580c] animate-blink" : st === "run" || st === "cs" || st === "boost" ? "bg-[#ea580c]" : "bg-muted-foreground/40",
                      )}
                    />
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {frame?.reset ? "Reiniciada" : STATE_LABEL[st]}
                    </span>
                  </span>
                  <span className={cn("text-xs font-mono text-right", boosted ? "text-[#ea580c] font-bold" : "text-foreground")}>
                    {boosted ? `${t.prio}→${eff}` : t.prio}
                  </span>
                </div>
              )
            })}
            <div className="flex items-center justify-between py-3 mt-1 border-t-2 border-foreground">
              <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono">Dueño de infoBus</span>
              <span className="text-xs font-mono text-foreground">
                {frame?.owner ? TASKS.find((x) => x.id === frame.owner)?.name : "libre"}
              </span>
            </div>
          </div>
          <div className="mt-auto border-t-2 border-foreground">
            <div className="px-4 py-2 border-b-2 border-foreground text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
              creacion_del_mutex.c
            </div>
            <pre className="bg-foreground text-background text-[11px] font-mono p-4 overflow-x-auto leading-relaxed">
              {mode === "sin"
                ? "/* 1997: mutex sin herencia */\ninfoBus = semMCreate(\n    SEM_Q_PRIORITY);"
                : "/* el parche: herencia de prioridad */\ninfoBus = semMCreate(\n    SEM_Q_PRIORITY |\n    SEM_INVERSION_SAFE);"}
            </pre>
            <p className="px-4 py-3 text-[10px] font-mono text-muted-foreground leading-relaxed">
              Simplificado. En el rover real, JPL activó la herencia en el mutex que usaba <code>select()</code> cambiando
              una variable global con un parche enviado desde la Tierra.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-foreground">
        <SimLog lines={events} title="vxworks.log" empty="> sistema listo. t=00" />
      </div>
    </SimWindow>
  )
}
