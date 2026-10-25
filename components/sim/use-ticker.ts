"use client"

import { useEffect, useRef } from "react"

/** Llama a `onTick` cada `intervalMs` mientras `active` sea true. */
export function useTicker(active: boolean, intervalMs: number, onTick: () => void) {
  const ref = useRef(onTick)

  useEffect(() => {
    ref.current = onTick
  })

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => ref.current(), intervalMs)
    return () => window.clearInterval(id)
  }, [active, intervalMs])
}
