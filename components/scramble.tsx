"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"

/** Número que "se revuelve" al entrar en pantalla (de metrics-card del template). */
export function ScrambleNumber({
  target,
  label,
  delay = 0,
  size = "lg",
}: {
  target: string
  label: string
  delay?: number
  size?: "lg" | "md"
}) {
  const [display, setDisplay] = useState(target.replace(/[0-9]/g, "0"))
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  useEffect(() => {
    if (!inView) return
    let interval: number | undefined
    const timeout = window.setTimeout(() => {
      let iterations = 0
      const max = 20
      interval = window.setInterval(() => {
        if (iterations >= max) {
          setDisplay(target)
          window.clearInterval(interval)
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
    }, delay)
    return () => {
      window.clearTimeout(timeout)
      if (interval) window.clearInterval(interval)
    }
  }, [inView, target, delay])

  return (
    <div ref={ref} className="flex flex-col gap-1">
      <span
        className={
          size === "lg"
            ? "text-3xl lg:text-5xl font-mono font-bold tracking-tight text-foreground"
            : "text-2xl lg:text-3xl font-mono font-bold tracking-tight text-foreground"
        }
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {display}
      </span>
      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">{label}</span>
    </div>
  )
}

/** Texto que se descifra letra por letra (de about-section del template). */
export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })

  useEffect(() => {
    if (!inView) return
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_./:"
    let iteration = 0
    const interval = window.setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " "
            if (i < iteration) return text[i]
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join(""),
      )
      iteration += 0.5
      if (iteration >= text.length) {
        setDisplay(text)
        window.clearInterval(interval)
      }
    }, 30)
    return () => window.clearInterval(interval)
  }, [inView, text])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
