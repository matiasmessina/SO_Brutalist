"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { Check, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { InfernoWorld, type MonitorMsg, type OutLine } from "@/lib/sims/inferno"
import { SimWindow } from "@/components/sim/sim-window"
import { CtrlButton } from "@/components/sim/controls"

type Pid = 12 | 31

interface TermLine {
  text: string
  tone: OutLine["tone"] | "in"
}

const BANNER: Record<Pid, TermLine[]> = {
  12: [
    { text: "Inferno 4th Edition · simulación didáctica", tone: "sys" },
    { text: "proceso sh (pid 12) · namespace completo · escribí help o usá el recorrido", tone: "sys" },
  ],
  31: [
    { text: "proceso sandbox (pid 31) · namespace reducido: sin /net ni /prog", tone: "sys" },
    { text: "mismo sistema, misma máquina: lo único distinto es lo que este proceso puede nombrar", tone: "sys" },
  ],
}

const TOUR: { pid: Pid; cmd: string; note: string }[] = [
  { pid: 12, cmd: "ls /", note: "dev, net, prog y env no son carpetas comunes: son servicios del sistema." },
  { pid: 12, cmd: "cat /dev/sysname", note: "Un dispositivo del kernel se lee como un archivo." },
  { pid: 12, cmd: "cat /prog/12/ns", note: "Hasta el namespace del proceso es un archivo." },
  { pid: 12, cmd: "mount tcp!lab!styx /n/lab", note: "Montamos otra máquina. Mirá Tversion y Tattach en el visor." },
  { pid: 12, cmd: "cat /n/lab/dev/sensor/temp", note: "Leer un sensor remoto: Twalk, Topen, Tread y Tclunk." },
  { pid: 12, cmd: "echo hola desde terminal > /n/lab/dev/cons", note: "Escribimos en la consola de la otra máquina." },
  { pid: 12, cmd: "bind -a /n/lab/dev/sensor /dev", note: "Unimos el sensor remoto al /dev local." },
  { pid: 12, cmd: "cat /dev/temp", note: "Parece un dispositivo local, pero viaja por 9P." },
  { pid: 31, cmd: "ls /net", note: "En el sandbox, /net está vacío: el proceso no tiene red." },
  { pid: 31, cmd: "mount tcp!lab!styx /n/lab", note: "Sin /net no puede ni abrir la conexión." },
]

const MAX_MONITOR = 40

export function InfernoLab() {
  const worldRef = useRef<InfernoWorld | null>(null)
  if (!worldRef.current) worldRef.current = new InfernoWorld()

  const [pid, setPid] = useState<Pid>(12)
  const [term, setTerm] = useState<Record<Pid, TermLine[]>>({ 12: BANNER[12], 31: BANNER[31] })
  const [history, setHistory] = useState<Record<Pid, string[]>>({ 12: [], 31: [] })
  const [histIdx, setHistIdx] = useState<number | null>(null)
  const [input, setInput] = useState("")
  const [monitor, setMonitor] = useState<MonitorMsg[]>([])
  const [queue, setQueue] = useState<MonitorMsg[]>([])
  const [latest, setLatest] = useState<{ key: number; msg: MonitorMsg } | null>(null)
  const [labConsole, setLabConsole] = useState<string[]>([])
  const [done, setDone] = useState<Set<number>>(new Set())
  const [mounted, setMounted] = useState<Record<Pid, boolean>>({ 12: false, 31: false })

  const termRef = useRef<HTMLDivElement>(null)
  const monRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Desplazar al final cuando cambia el contenido
  useEffect(() => {
    termRef.current?.scrollTo({ top: termRef.current.scrollHeight })
  }, [term, pid])
  useEffect(() => {
    monRef.current?.scrollTo({ top: monRef.current.scrollHeight })
  }, [monitor])

  // Mostrar los mensajes del visor de a uno, como si viajaran por la red
  useEffect(() => {
    if (queue.length === 0) return
    const id = window.setTimeout(() => {
      const [next, ...rest] = queue
      setMonitor((m) => [...m, next].slice(-MAX_MONITOR))
      setLatest({ key: Date.now() + Math.random(), msg: next })
      setQueue(rest)
    }, 230)
    return () => window.clearTimeout(id)
  }, [queue])

  const run = (target: Pid, raw: string) => {
    const cmd = raw.trim()
    const world = worldRef.current!
    const res = world.exec(target, cmd)
    setTerm((t) => {
      const prev = res.clear ? [] : t[target]
      const lines: TermLine[] = cmd ? [{ text: cmd, tone: "in" }] : []
      return { ...t, [target]: [...prev, ...(res.clear ? [] : lines), ...res.out] }
    })
    if (cmd) setHistory((h) => ({ ...h, [target]: [...h[target], cmd] }))
    if (res.monitor.length) setQueue((q) => [...q, { kind: "info", text: `pid ${target} · ; ${cmd}` }, ...res.monitor])
    if (res.lab.length) setLabConsole((l) => [...l, ...res.lab].slice(-6))
    setMounted({
      12: world.procs[12].ns.some((e) => e.source.machine === "lab"),
      31: world.procs[31].ns.some((e) => e.source.machine === "lab"),
    })
  }

  const submit = () => {
    run(pid, input)
    setInput("")
    setHistIdx(null)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      submit()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const h = history[pid]
      if (!h.length) return
      const i = histIdx === null ? h.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(i)
      setInput(h[i])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const h = history[pid]
      if (histIdx === null) return
      const i = histIdx + 1
      if (i >= h.length) {
        setHistIdx(null)
        setInput("")
      } else {
        setHistIdx(i)
        setInput(h[i])
      }
    }
  }

  const runStep = (i: number) => {
    const s = TOUR[i]
    setPid(s.pid)
    run(s.pid, s.cmd)
    setDone((d) => new Set(d).add(i))
    inputRef.current?.focus({ preventScroll: true })
  }

  const reset = () => {
    worldRef.current = new InfernoWorld()
    setPid(12)
    setTerm({ 12: BANNER[12], 31: BANNER[31] })
    setHistory({ 12: [], 31: [] })
    setInput("")
    setMonitor([])
    setQueue([])
    setLatest(null)
    setLabConsole([])
    setDone(new Set())
    setMounted({ 12: false, 31: false })
  }

  const nextStep = TOUR.findIndex((_, i) => !done.has(i))
  const styxCount = monitor.filter((m) => m.kind === "T" || m.kind === "R" || m.kind === "Rerror").length

  return (
    <SimWindow title="inferno.sh · styx.monitor">
      {/* Barra: procesos */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">Proceso</span>
          <div className="inline-flex border-2 border-foreground">
            {([12, 31] as Pid[]).map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => setPid(p)}
                className={cn(
                  "px-3 py-2 text-[10px] tracking-[0.15em] uppercase font-mono transition-colors",
                  i > 0 && "border-l-2 border-foreground",
                  pid === p ? "bg-foreground text-background" : "hover:bg-muted",
                )}
              >
                {p === 12 ? "pid 12 · sh" : "pid 31 · sandbox"}
              </button>
            ))}
          </div>
        </div>
        <CtrlButton onClick={reset}>
          <RotateCcw size={12} />
          Reiniciar
        </CtrlButton>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr]">
        {/* Terminal */}
        <div className="flex flex-col xl:border-r-2 border-foreground">
          <div className="flex items-center justify-between px-4 py-2 border-b-2 border-foreground">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
              {pid === 12 ? "/dev/cons · sh" : "/dev/cons · sandbox"}
            </span>
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
              cwd {worldRef.current!.procs[pid].cwd}
            </span>
          </div>
          <div
            ref={termRef}
            onClick={() => inputRef.current?.focus({ preventScroll: true })}
            className="bg-foreground h-[380px] xl:h-0 xl:flex-1 xl:min-h-[380px] overflow-y-auto p-4 cursor-text"
          >
            <div className="flex flex-col gap-0.5">
              {term[pid].map((l, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-xs font-mono whitespace-pre-wrap break-words leading-relaxed",
                    l.tone === "in" && "text-background",
                    l.tone === "out" && "text-background/85",
                    l.tone === "err" && "text-[#fb923c]",
                    l.tone === "sys" && "text-background/50",
                  )}
                >
                  {l.tone === "in" && <span className="text-[#ea580c]">{"; "}</span>}
                  {l.text}
                </span>
              ))}
              <div className="flex items-center text-xs font-mono">
                <span className="text-[#ea580c]">{"; "}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  spellCheck={false}
                  autoComplete="off"
                  aria-label="Comando de Inferno"
                  className="flex-1 bg-transparent text-background outline-none caret-[#ea580c] font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visor 9P y consola remota */}
        <div className="flex flex-col border-t-2 xl:border-t-0 border-foreground">
          <div className="flex items-center justify-between px-4 py-2 border-b-2 border-foreground">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">styx.monitor · 9P2000</span>
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">{styxCount} mensajes</span>
          </div>
          <div className="px-4 pt-3">
            <svg viewBox="0 0 520 96" className="w-full h-auto" role="img" aria-label="Mensajes Styx entre terminal y servidor-lab">
              <rect x={4} y={22} width={150} height={52} fill="hsl(var(--foreground))" />
              <text x={79} y={44} textAnchor="middle" fontSize={11} fontWeight={700} fill="hsl(var(--background))" fontFamily="var(--font-mono), monospace">
                terminal
              </text>
              <text x={79} y={60} textAnchor="middle" fontSize={9} fill="hsl(var(--background))" opacity={0.7} fontFamily="var(--font-mono), monospace">
                cliente · pid {pid}
              </text>
              <rect x={366} y={22} width={150} height={52} fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth={2} />
              <text x={441} y={44} textAnchor="middle" fontSize={11} fontWeight={700} fill="hsl(var(--foreground))" fontFamily="var(--font-mono), monospace">
                servidor-lab
              </text>
              <text x={441} y={60} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono), monospace">
                servidor Styx · :6666
              </text>
              <line
                x1={154}
                y1={48}
                x2={366}
                y2={48}
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                strokeDasharray={mounted[pid] ? "0" : "4 4"}
                opacity={mounted[pid] ? 1 : 0.4}
              />
              <text x={260} y={86} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono), monospace">
                {mounted[pid] ? "montado en el namespace de este proceso" : "sin montar en este proceso"}
              </text>
              {latest && (latest.msg.kind === "T" || latest.msg.kind === "R" || latest.msg.kind === "Rerror") && (
                <g key={latest.key}>
                  <motion.circle
                    r={5}
                    cy={48}
                    fill="#ea580c"
                    initial={{ cx: latest.msg.kind === "T" ? 160 : 360, opacity: 1 }}
                    animate={{ cx: latest.msg.kind === "T" ? 360 : 160, opacity: [1, 1, 0] }}
                    transition={{ duration: 0.22, ease: "linear" }}
                  />
                  <text x={260} y={38} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ea580c" fontFamily="var(--font-mono), monospace">
                    {latest.msg.text.split(" ")[0]} {latest.msg.kind === "T" ? "→" : "←"}
                  </text>
                </g>
              )}
            </svg>
          </div>
          <div ref={monRef} className="h-[200px] overflow-y-auto px-4 py-2 border-t border-border">
            {monitor.length === 0 && (
              <span className="text-[11px] font-mono text-muted-foreground">
                Acá aparecen los mensajes del protocolo. Probá montar la máquina lab.
              </span>
            )}
            <div className="flex flex-col gap-1">
              {monitor.map((m, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-[11px] font-mono leading-snug break-words",
                    m.kind === "T" && "text-foreground",
                    m.kind === "R" && "text-muted-foreground pl-4",
                    m.kind === "Rerror" && "text-[#ea580c] pl-4",
                    m.kind === "local" && "text-muted-foreground italic",
                    m.kind === "info" && "text-[#ea580c] border-t border-border pt-1 mt-1 uppercase tracking-wider text-[9px]",
                  )}
                >
                  {m.text}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-auto border-t-2 border-foreground">
            <div className="px-4 py-2 border-b-2 border-foreground text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
              consola de servidor-lab
            </div>
            <div className="bg-foreground px-4 py-3 h-[84px] overflow-hidden">
              {labConsole.length === 0 ? (
                <span className="text-xs font-mono text-background/50">servidor-lab listo.</span>
              ) : (
                labConsole.map((l, i) => (
                  <span key={i} className="block text-xs font-mono text-background">
                    <span className="text-[#ea580c]">{"> "}</span>
                    {l}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recorrido guiado */}
      <div className="border-t-2 border-foreground">
        <div className="flex items-center justify-between px-4 py-2 border-b-2 border-foreground">
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">recorrido_guiado.txt</span>
          <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-mono">
            {done.size}/{TOUR.length} · hacé clic para ejecutar
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
          {TOUR.map((s, i) => (
            <button
              key={s.cmd + i}
              type="button"
              onClick={() => runStep(i)}
              className={cn(
                "group flex flex-col gap-2 p-4 text-left border-b border-border xl:border-r transition-colors",
                i === nextStep ? "bg-[#ea580c]/10" : "hover:bg-muted",
              )}
            >
              <span className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase">
                <span className={cn("font-bold", done.has(i) ? "text-muted-foreground" : "text-[#ea580c]")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-muted-foreground">pid {s.pid}</span>
                {done.has(i) && <Check size={12} className="text-[#ea580c]" />}
              </span>
              <code className="text-[11px] font-mono text-foreground break-all">{s.cmd}</code>
              <span className="text-[11px] font-mono text-muted-foreground leading-relaxed">{s.note}</span>
            </button>
          ))}
        </div>
      </div>
    </SimWindow>
  )
}
