/**
 * Modelo simplificado de los "scheduling contexts" de seL4 MCS.
 * Prioridades fijas al estilo seL4: 255 es la más alta.
 * Con MCS cada tarea tiene un presupuesto (budget) de CPU por período; al agotarlo
 * queda frenada hasta la recarga, aunque tenga la prioridad más alta.
 */

export const PERIOD = 10
export const HORIZON = 40

export interface McsTask {
  id: string
  name: string
  role: string
  prio: number
  need: number
  budget: number
}

export const MCS_TASKS: McsTask[] = [
  { id: "nav", name: "NAVEGACIÓN", role: "prio 250 · 2 ms / 10 ms", prio: 250, need: 1, budget: 2 },
  { id: "ctrl", name: "CONTROL", role: "prio 200 · 3 ms / 10 ms", prio: 200, need: 3, budget: 4 },
  { id: "tele", name: "TELEMETRÍA", role: "prio 100 · 2 ms / 10 ms", prio: 100, need: 2, budget: 3 },
]

export type McsCell = "empty" | "run" | "ready" | "throttled"

export interface McsFrame {
  t: number
  cells: Record<string, McsCell>
  budget: Record<string, number>
  misses: string[]
  events: { text: string; tone?: "normal" | "accent" | "dim" }[]
}

const tt = (t: number) => `[${String(t).padStart(2, "0")} ms]`

export function simulateMcs(mcs: boolean, bugAt: number | null): McsFrame[] {
  const rem: Record<string, number> = {}
  const budget: Record<string, number> = {}
  const frames: McsFrame[] = []
  let prev: string | null = null

  for (let t = 0; t < HORIZON; t++) {
    const events: McsFrame["events"] = []
    const misses: string[] = []

    if (t % PERIOD === 0) {
      for (const task of MCS_TASKS) {
        if (t > 0 && (rem[task.id] ?? 0) > 0 && task.id !== "nav") {
          misses.push(task.id)
          events.push({ text: `${tt(t)} ${task.name} perdió su plazo`, tone: "accent" })
        }
        const looping = task.id === "nav" && bugAt !== null && t >= bugAt
        rem[task.id] = looping ? Number.POSITIVE_INFINITY : task.need
        budget[task.id] = task.budget
      }
      if (t > 0 && mcs) events.push({ text: `${tt(t)} recarga de presupuestos`, tone: "dim" })
    }

    if (bugAt !== null && t === bugAt) {
      rem.nav = Number.POSITIVE_INFINITY
      events.push({ text: `${tt(t)} NAVEGACIÓN entra en un bucle infinito`, tone: "accent" })
    }

    const candidates = MCS_TASKS.filter((task) => rem[task.id] > 0 && (!mcs || budget[task.id] > 0)).sort(
      (a, b) => b.prio - a.prio,
    )
    const chosen = candidates[0] ?? null

    const cells: Record<string, McsCell> = {}
    if (chosen) {
      cells[chosen.id] = "run"
      rem[chosen.id] -= 1
      if (mcs) {
        budget[chosen.id] -= 1
        if (budget[chosen.id] === 0 && rem[chosen.id] > 0) {
          events.push({ text: `${tt(t)} ${chosen.name} agotó su presupuesto → frenada hasta la recarga`, tone: "accent" })
        }
      }
      if (chosen.id !== prev && prev && chosen.id !== "nav" && rem.nav === Number.POSITIVE_INFINITY && mcs) {
        events.push({ text: `${tt(t)} ${chosen.name} obtiene la CPU aunque NAVEGACIÓN sigue en bucle` })
      }
    }
    for (const task of MCS_TASKS) {
      if (cells[task.id]) continue
      if (rem[task.id] > 0) cells[task.id] = mcs && budget[task.id] === 0 ? "throttled" : "ready"
      else cells[task.id] = "empty"
    }
    prev = chosen?.id ?? null

    frames.push({ t, cells, budget: { ...budget }, misses, events })
  }
  return frames
}
