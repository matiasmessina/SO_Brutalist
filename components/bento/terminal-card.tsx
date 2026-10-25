"use client"

import { useEffect, useState } from "react"

const DEFAULT_LINES = [
  "> Iniciando laboratorio...",
  "> Cargando seL4, VxWorks e Inferno",
  "> --------- LISTO ---------",
]

/** Terminal animada del template; ahora acepta sus propias líneas y título. */
export function TerminalCard({
  lines: source = DEFAULT_LINES,
  title = "terminal.sys",
  speed = 700,
}: {
  lines?: string[]
  title?: string
  speed?: number
}) {
  const [lines, setLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)

  useEffect(() => {
    setLines([source[0]])
    setCurrentLine(0)
    const interval = setInterval(() => {
      setCurrentLine((prev) => {
        const next = prev + 1
        if (next >= source.length) {
          setLines([source[0]])
          return 0
        }
        setLines((l) => [...l.slice(-6), source[next]])
        return next
      })
    }, speed)
    return () => clearInterval(interval)
  }, [source, speed])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b-2 border-foreground px-4 py-2">
        <span className="h-2 w-2 bg-[#ea580c]" />
        <span className="h-2 w-2 bg-foreground" />
        <span className="h-2 w-2 border border-foreground" />
        <span className="ml-auto text-[10px] tracking-widest text-muted-foreground uppercase">{title}</span>
      </div>
      <div className="flex-1 bg-foreground p-4 overflow-hidden min-h-[150px]">
        <div className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <span
              key={`${currentLine}-${i}`}
              className="text-xs text-background font-mono block truncate"
              style={{ opacity: i === lines.length - 1 ? 1 : 0.6 }}
            >
              {line}
            </span>
          ))}
          <span className="text-xs text-[#ea580c] font-mono animate-blink">{"_"}</span>
        </div>
      </div>
    </div>
  )
}
