"use client"

import type { ReactNode } from "react"
import { Pause, Play, RotateCcw, StepForward } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "solid" | "outline" | "accent"

export function CtrlButton({
  children,
  onClick,
  disabled,
  variant = "outline",
  title,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: Variant
  title?: string
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3 py-2 text-[10px] tracking-[0.18em] uppercase font-mono transition-colors",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        variant === "solid" && "bg-foreground text-background hover:bg-foreground/85",
        variant === "outline" && "border-2 border-foreground text-foreground hover:bg-foreground hover:text-background",
        variant === "accent" && "bg-[#ea580c] text-white hover:bg-[#c2410c]",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function PlayControls({
  playing,
  onToggle,
  onStep,
  onReset,
  finished,
}: {
  playing: boolean
  onToggle: () => void
  onStep: () => void
  onReset: () => void
  finished?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CtrlButton variant="solid" onClick={onToggle} disabled={finished}>
        {playing ? <Pause size={12} /> : <Play size={12} />}
        {playing ? "Pausa" : "Reproducir"}
      </CtrlButton>
      <CtrlButton onClick={onStep} disabled={playing || finished}>
        <StepForward size={12} />
        Paso
      </CtrlButton>
      <CtrlButton onClick={onReset}>
        <RotateCcw size={12} />
        Reiniciar
      </CtrlButton>
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {label && (
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">{label}</span>
      )}
      <div className="inline-flex border-2 border-foreground">
        {options.map((o, i) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={cn(
              "px-3 py-2 text-[10px] tracking-[0.15em] uppercase font-mono transition-colors",
              i > 0 && "border-l-2 border-foreground",
              value === o.value ? "bg-foreground text-background" : "text-foreground hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Indicador de tiempo simulado, estilo "TICK:0003". */
export function TickBadge({ t, unit = "t" }: { t: number; unit?: string }) {
  return (
    <span className="text-[10px] tracking-widest text-muted-foreground font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
      {`${unit.toUpperCase()}=${String(t).padStart(3, "0")}`}
    </span>
  )
}
