"use client"

import { cn } from "@/lib/utils"

export type GanttCell =
  | "empty" // la tarea todavía no existe
  | "run" // ejecutando
  | "cs" // ejecutando dentro de la sección crítica (tiene el mutex)
  | "boost" // ejecutando con prioridad heredada
  | "ready" // lista pero esperando CPU
  | "blocked" // bloqueada esperando un recurso
  | "throttled" // sin presupuesto de CPU (MCS)
  | "done" // terminó

export interface GanttRow {
  id: string
  label: string
  sub?: string
}

export interface GanttMarker {
  t: number
  label: string
  tone?: "accent" | "normal"
}

const CELL_CLASS: Record<GanttCell, string> = {
  empty: "",
  run: "bg-foreground",
  cs: "bg-[#ea580c]",
  boost: "bg-[#ea580c] hatch-light",
  ready: "bg-muted",
  blocked: "hatch",
  throttled: "hatch-accent",
  done: "",
}

export const GANTT_LEGEND: Record<GanttCell, string> = {
  empty: "",
  run: "Ejecutando",
  cs: "Ejecutando con el mutex",
  boost: "Con prioridad heredada",
  ready: "Lista, esperando CPU",
  blocked: "Bloqueada",
  throttled: "Sin presupuesto (frenada)",
  done: "",
}

export function Gantt({
  rows,
  horizon,
  cellAt,
  current,
  markers = [],
  missesAt,
  cellLabel,
}: {
  rows: GanttRow[]
  horizon: number
  /** Devuelve el estado de la celda o null si ese tick todavía no se simuló. */
  cellAt: (rowId: string, t: number) => GanttCell | null
  current: number
  markers?: GanttMarker[]
  missesAt?: (rowId: string, t: number) => boolean
  cellLabel?: (rowId: string, t: number) => string | null
}) {
  const cols = Array.from({ length: horizon }, (_, i) => i)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Rótulos de los marcadores */}
        {markers.length > 0 && (
          <div className="flex">
            <div className="w-36 shrink-0" />
            <div className="relative flex-1 h-5">
              {markers.map((m) => (
                <span
                  key={`lbl-${m.t}-${m.label}`}
                  className={cn(
                    "absolute top-0 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono uppercase tracking-wider px-1",
                    m.tone === "accent" ? "text-[#ea580c]" : "text-foreground",
                  )}
                  style={{ left: `${(m.t / horizon) * 100}%` }}
                >
                  {m.label} ▾
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Eje de tiempo */}
        <div className="flex items-end">
          <div className="w-36 shrink-0" />
          <div className="relative flex-1 grid" style={{ gridTemplateColumns: `repeat(${horizon}, minmax(0, 1fr))` }}>
            {cols.map((t) => (
              <span
                key={t}
                className={cn(
                  "text-[9px] font-mono text-center pb-1",
                  t === current ? "text-[#ea580c] font-bold" : "text-muted-foreground",
                )}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {t % 2 === 0 || horizon <= 24 ? t : ""}
              </span>
            ))}
          </div>
        </div>

        {/* Filas */}
        <div className="relative">
          {rows.map((row) => (
            <div key={row.id} className="flex items-stretch border-t border-border">
              <div className="w-36 shrink-0 flex flex-col justify-center py-2 pr-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-foreground">{row.label}</span>
                {row.sub && <span className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase">{row.sub}</span>}
              </div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${horizon}, minmax(0, 1fr))` }}>
                {cols.map((t) => {
                  const st = cellAt(row.id, t)
                  const miss = missesAt?.(row.id, t)
                  const lbl = cellLabel?.(row.id, t)
                  return (
                    <div key={t} className="relative h-9 border-l border-border/60">
                      {st && st !== "empty" && st !== "done" && (
                        <div className={cn("absolute inset-x-[1px] inset-y-2", CELL_CLASS[st])} />
                      )}
                      {lbl && (
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-muted-foreground">
                          {lbl}
                        </span>
                      )}
                      {miss && (
                        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[11px] font-mono font-bold text-[#ea580c] leading-none">
                          ✕
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Cursor y marcadores verticales */}
          <div className="pointer-events-none absolute inset-0 flex">
            <div className="w-36 shrink-0" />
            <div className="relative flex-1">
              {markers.map((m) => (
                <div
                  key={`${m.t}-${m.label}`}
                  className={cn("absolute top-0 bottom-0 border-l-2 border-dashed", m.tone === "accent" ? "border-[#ea580c]" : "border-foreground")}
                  style={{ left: `${(m.t / horizon) * 100}%` }}
                />
              ))}
              {current >= 0 && current < horizon && (
                <div
                  className="absolute top-0 bottom-0 bg-[#ea580c]/10 border-x border-[#ea580c]/40"
                  style={{ left: `${(current / horizon) * 100}%`, width: `${100 / horizon}%` }}
                />
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-border" />
      </div>
    </div>
  )
}

export function GanttLegend({ items }: { items: GanttCell[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((it) => (
        <span key={it} className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span className={cn("inline-block h-3 w-5 border border-foreground/40", CELL_CLASS[it])} />
          {GANTT_LEGEND[it]}
        </span>
      ))}
    </div>
  )
}
