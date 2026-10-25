/**
 * Modelo simplificado del bug de inversión de prioridades del Mars Pathfinder (1997).
 * Planificador preemptivo por prioridades fijas al estilo VxWorks: 0 es la prioridad más alta.
 * Tres tareas comparten un mutex ("infoBus"). Un watchdog (bc_sched) verifica al final
 * del ciclo que bc_dist haya terminado; si no, reinicia el sistema.
 */

export type Seg = { kind: "cpu"; n: number } | { kind: "lock" } | { kind: "unlock" }

export interface TaskSpec {
  id: string
  name: string
  role: string
  prio: number
  arrival: number
  script: Seg[]
}

export type PfCell = "empty" | "run" | "cs" | "boost" | "ready" | "blocked" | "done"

export interface PfEvent {
  text: string
  tone?: "normal" | "accent" | "dim"
}

export interface PfFrame {
  t: number
  running: string | null
  cells: Record<string, PfCell>
  eff: Record<string, number>
  owner: string | null
  events: PfEvent[]
  reset: boolean
  ok: boolean
}

export const HORIZON = 20
export const DEADLINE = 14

export const TASKS: TaskSpec[] = [
  {
    id: "bc",
    name: "bc_dist",
    role: "Bus de información",
    prio: 10,
    arrival: 2,
    script: [{ kind: "cpu", n: 1 }, { kind: "lock" }, { kind: "cpu", n: 2 }, { kind: "unlock" }, { kind: "cpu", n: 1 }],
  },
  {
    id: "comm",
    name: "comm",
    role: "Comunicaciones",
    prio: 50,
    arrival: 3,
    script: [{ kind: "cpu", n: 9 }],
  },
  {
    id: "met",
    name: "ASI/MET",
    role: "Meteorología",
    prio: 100,
    arrival: 0,
    script: [{ kind: "cpu", n: 1 }, { kind: "lock" }, { kind: "cpu", n: 3 }, { kind: "unlock" }, { kind: "cpu", n: 1 }],
  },
]

interface TState {
  spec: TaskSpec
  pc: number
  rem: number
  eff: number
  blocked: boolean
  done: boolean
  holds: boolean
}

function advance(s: TState) {
  s.pc++
  if (s.pc >= s.spec.script.length) {
    s.done = true
    return
  }
  const seg = s.spec.script[s.pc]
  if (seg.kind === "cpu") s.rem = seg.n
}

const tt = (t: number) => `[t=${String(t).padStart(2, "0")}]`

export function simulatePathfinder(inherit: boolean): PfFrame[] {
  const states: TState[] = TASKS.map((spec) => {
    const first = spec.script[0]
    return { spec, pc: 0, rem: first.kind === "cpu" ? first.n : 0, eff: spec.prio, blocked: false, done: false, holds: false }
  })
  const byId = (id: string) => states.find((s) => s.spec.id === id)!
  let owner: string | null = null
  const waiters: TState[] = []
  let prevRunning: string | null = null
  const frames: PfFrame[] = []

  for (let t = 0; t < HORIZON; t++) {
    const events: PfEvent[] = []

    // Watchdog al final del ciclo
    if (t === DEADLINE) {
      const bc = byId("bc")
      if (!bc.done) {
        events.push({ text: `${tt(t)} bc_sched: bc_dist no terminó a tiempo`, tone: "accent" })
        events.push({ text: `${tt(t)} WATCHDOG → RESET DEL SISTEMA`, tone: "accent" })
        frames.push({ t, running: null, cells: Object.fromEntries(states.map((s) => [s.spec.id, "empty" as PfCell])), eff: {}, owner, events, reset: true, ok: false })
        return frames
      }
      events.push({ text: `${tt(t)} bc_sched: bc_dist terminó, ciclo OK` })
    }

    for (const s of states) {
      if (s.spec.arrival === t) events.push({ text: `${tt(t)} llega ${s.spec.name} (prio ${s.spec.prio})`, tone: "dim" })
    }

    let chosen: TState | null = null
    for (let guard = 0; guard < 12; guard++) {
      const ready = states
        .filter((s) => s.spec.arrival <= t && !s.done && !s.blocked)
        .sort((a, b) => a.eff - b.eff || a.spec.prio - b.spec.prio)
      if (ready.length === 0) break
      const s = ready[0]
      const seg = s.spec.script[s.pc]

      if (seg.kind === "lock") {
        if (owner === null) {
          owner = s.spec.id
          s.holds = true
          events.push({ text: `${tt(t)} ${s.spec.name}: semTake(infoBus) → tomado` })
          advance(s)
          continue
        }
        const o = byId(owner)
        s.blocked = true
        waiters.push(s)
        events.push({ text: `${tt(t)} ${s.spec.name}: semTake(infoBus) → BLOQUEADA (dueño: ${o.spec.name})`, tone: "accent" })
        if (inherit && s.eff < o.eff) {
          o.eff = s.eff
          events.push({ text: `${tt(t)} ${o.spec.name} hereda prioridad ${s.eff}`, tone: "accent" })
        }
        continue
      }

      if (seg.kind === "unlock") {
        owner = null
        s.holds = false
        const boosted = s.eff !== s.spec.prio
        s.eff = s.spec.prio
        events.push({ text: `${tt(t)} ${s.spec.name}: semGive(infoBus)${boosted ? ` → vuelve a prio ${s.spec.prio}` : ""}` })
        advance(s)
        if (waiters.length) {
          waiters.sort((a, b) => a.eff - b.eff)
          const w = waiters.shift()!
          w.blocked = false
          owner = w.spec.id
          w.holds = true
          events.push({ text: `${tt(t)} ${w.spec.name} despierta y toma infoBus` })
          advance(w)
        }
        continue
      }

      chosen = s
      break
    }

    if (chosen && prevRunning && prevRunning !== chosen.spec.id) {
      const prev = byId(prevRunning)
      if (!prev.done && !prev.blocked) {
        events.push({ text: `${tt(t)} ${chosen.spec.name} (prio ${chosen.eff}) desaloja a ${prev.spec.name}` })
      }
    }
    if (chosen && chosen.spec.id !== prevRunning && !chosen.holds) {
      const starved = states.find((s) => s.blocked && s.spec.prio < chosen!.eff)
      if (starved) {
        events.push({
          text: `${tt(t)} INVERSIÓN: ${chosen.spec.name} (prio ${chosen.eff}) corre y ${starved.spec.name} (prio ${starved.spec.prio}) sigue esperando`,
          tone: "accent",
        })
      }
    }

    const cells: Record<string, PfCell> = {}
    if (chosen) {
      cells[chosen.spec.id] = chosen.holds ? (chosen.eff < chosen.spec.prio ? "boost" : "cs") : "run"
      chosen.rem--
      if (chosen.rem <= 0) {
        advance(chosen)
        if (chosen.done) events.push({ text: `${tt(t)} ${chosen.spec.name} terminó` })
      }
    }
    for (const s of states) {
      if (cells[s.spec.id]) continue
      if (s.spec.arrival > t) cells[s.spec.id] = "empty"
      else if (s.done) cells[s.spec.id] = "done"
      else if (s.blocked) cells[s.spec.id] = "blocked"
      else cells[s.spec.id] = "ready"
    }

    prevRunning = chosen ? chosen.spec.id : null
    frames.push({
      t,
      running: chosen ? chosen.spec.id : null,
      cells,
      eff: Object.fromEntries(states.map((s) => [s.spec.id, s.eff])),
      owner,
      events,
      reset: false,
      ok: t >= DEADLINE,
    })
  }
  return frames
}
