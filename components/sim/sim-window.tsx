import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Marco de ventana brutalista para cada simulador (mismo estilo que terminal.sys del template). */
export function SimWindow({
  title,
  right,
  children,
  className,
  badge = true,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
  badge?: boolean
}) {
  return (
    <div className={cn("border-2 border-foreground bg-background", className)}>
      <div className="flex items-center gap-2 border-b-2 border-foreground px-4 py-2">
        <span className="h-2 w-2 bg-[#ea580c]" />
        <span className="h-2 w-2 bg-foreground" />
        <span className="h-2 w-2 border border-foreground" />
        <span className="ml-2 text-[10px] tracking-widest text-muted-foreground uppercase font-mono truncate">{title}</span>
        <div className="ml-auto flex items-center gap-3">
          {right}
          {badge && (
            <span className="hidden sm:inline-block border border-foreground px-2 py-0.5 text-[9px] tracking-[0.15em] uppercase font-mono text-foreground">
              Simulación didáctica
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

/** Barra de herramientas debajo del encabezado de la ventana. */
export function SimToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground px-4 py-3", className)}>
      {children}
    </div>
  )
}

/** Bitácora tipo terminal (fondo invertido). */
export function SimLog({
  lines,
  title = "bitacora.log",
  className,
  empty = "> esperando eventos...",
}: {
  lines: { text: string; tone?: "normal" | "accent" | "dim" }[]
  title?: string
  className?: string
  empty?: string
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="px-4 py-2 border-b-2 border-foreground text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
        {title}
      </div>
      <div className="flex-1 bg-foreground p-4 overflow-hidden min-h-[140px]">
        <div className="flex flex-col gap-1">
          {lines.length === 0 && <span className="text-xs text-background/60 font-mono">{empty}</span>}
          {lines.slice(-9).map((l, i, arr) => (
            <span
              key={`${i}-${l.text}`}
              className={cn(
                "text-xs font-mono block leading-relaxed",
                l.tone === "accent" ? "text-[#fb923c]" : "text-background",
              )}
              style={{ opacity: l.tone === "dim" ? 0.55 : i === arr.length - 1 ? 1 : 0.75 }}
            >
              {l.text}
            </span>
          ))}
          <span className="text-xs text-[#ea580c] font-mono animate-blink">{"_"}</span>
        </div>
      </div>
    </div>
  )
}
