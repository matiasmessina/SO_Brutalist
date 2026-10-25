"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { RotateCcw, Skull } from "lucide-react"
import { cn } from "@/lib/utils"
import { SimLog, SimToolbar, SimWindow } from "@/components/sim/sim-window"
import { CtrlButton, Segmented } from "@/components/sim/controls"

type Mode = "sel4" | "mono"
type NodeId = "radio" | "camara" | "mision" | "vuelo"
type AttackId = "leer" | "motores" | "falso" | "forjar"
type Tone = "normal" | "accent" | "dim"

interface NodeDef {
  id: NodeId
  label: string
  sub: string
  x: number
  y: number
}

const W = 170
const H = 74
const KERNEL_Y = 290

const NODES: NodeDef[] = [
  { id: "radio", label: "RADIO", sub: "driver + pila de red", x: 30, y: 30 },
  { id: "camara", label: "CÁMARA", sub: "driver de video", x: 30, y: 160 },
  { id: "mision", label: "MISIÓN", sub: "planificador de ruta", x: 295, y: 95 },
  { id: "vuelo", label: "CONTROL DE VUELO", sub: "motores · crítico", x: 560, y: 95 },
]

const node = (id: NodeId) => NODES.find((n) => n.id === id)!
const center = (id: NodeId): [number, number] => {
  const n = node(id)
  return [n.x + W / 2, n.y + H / 2]
}
const gate = (id: NodeId): [number, number] => [node(id).x + W / 2, KERNEL_Y]

const CSPACE: Record<NodeId, { slot: string; obj: string; rights: string }[]> = {
  radio: [
    { slot: "0x01", obj: "Frame · búfer de la radio", rights: "RW" },
    { slot: "0x02", obj: "Endpoint · MISIÓN", rights: "Send" },
    { slot: "0x03", obj: "IRQHandler · antena", rights: "—" },
  ],
  camara: [
    { slot: "0x01", obj: "Frame · búfer de imagen", rights: "RW" },
    { slot: "0x02", obj: "Endpoint · MISIÓN", rights: "Send" },
    { slot: "0x03", obj: "IRQHandler · cámara", rights: "—" },
  ],
  mision: [
    { slot: "0x01", obj: "Endpoint · MISIÓN", rights: "Receive" },
    { slot: "0x02", obj: "Endpoint · VUELO", rights: "Send" },
    { slot: "0x03", obj: "Frame · mapa de ruta", rights: "RW" },
  ],
  vuelo: [
    { slot: "0x01", obj: "Endpoint · VUELO", rights: "Receive" },
    { slot: "0x02", obj: "Frame · registros de motores", rights: "RW" },
    { slot: "0x03", obj: "Frame · parámetros de vuelo", rights: "RW" },
    { slot: "0x04", obj: "IRQHandler · temporizador", rights: "—" },
  ],
}

const ATTACKS: { id: AttackId; label: string; wants: string }[] = [
  { id: "leer", label: "Leer la memoria de VUELO", wants: "Frame · parámetros de vuelo" },
  { id: "motores", label: "Escribir en los motores", wants: "Frame · registros de motores" },
  { id: "falso", label: "Mandar un comando falso a MISIÓN", wants: "Endpoint · MISIÓN" },
  { id: "forjar", label: "Fabricarse una capacidad nueva", wants: "Endpoint · VUELO" },
]

interface Anim {
  key: number
  path: [number, number][]
  end: "blocked" | "hit" | "delivered"
}

interface Outcome {
  vuelo: "ok" | "leaked" | "hijacked"
  mision: "ok" | "fooled" | "rejected"
  kernel: "ok" | "owned"
}

const OK: Outcome = { vuelo: "ok", mision: "ok", kernel: "ok" }

export function DroneSim() {
  const [mode, setMode] = useState<Mode>("sel4")
  const [compromised, setCompromised] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>(OK)
  const [log, setLog] = useState<{ text: string; tone?: Tone }[]>([])
  const [anim, setAnim] = useState<Anim | null>(null)
  const [selected, setSelected] = useState<NodeId>("radio")
  const [lastAttack, setLastAttack] = useState<AttackId | null>(null)

  const push = (lines: { text: string; tone?: Tone }[]) => setLog((l) => [...l, ...lines])
  const animate = (path: [number, number][], end: Anim["end"]) => setAnim({ key: Date.now(), path, end })

  const reset = (m: Mode = mode) => {
    setMode(m)
    setCompromised(false)
    setOutcome(OK)
    setLog([])
    setAnim(null)
    setLastAttack(null)
    setSelected("radio")
  }

  const compromise = () => {
    setCompromised(true)
    animate([[-10, 67], center("radio")], "hit")
    push([
      { text: "RED> paquete malformado → desborde de búfer en el driver de RADIO", tone: "accent" },
      mode === "sel4"
        ? { text: "RADIO comprometida: el atacante ejecuta código, pero solo con las capacidades de RADIO" }
        : { text: "RADIO comprometida: el driver corre en modo kernel → el atacante tiene privilegios de kernel", tone: "accent" },
    ])
  }

  const attack = (id: AttackId) => {
    setLastAttack(id)
    setSelected("radio")
    const R = center("radio")
    const G = gate("radio")

    if (mode === "sel4") {
      if (id === "leer") {
        animate([R, G], "blocked")
        push([
          { text: "RADIO> leer 0x4000_0000 (parámetros de VUELO)" },
          { text: "seL4: fallo de página → esa dirección no está mapeada en el VSpace de RADIO", tone: "accent" },
          { text: "seL4: el fallo va al manejador de RADIO, que la reinicia. VUELO ni se enteró.", tone: "dim" },
        ])
      } else if (id === "motores") {
        animate([R, G], "blocked")
        push([
          { text: "RADIO> seL4_Call(slot 0x0b → MOTORES)" },
          { text: "seL4: seL4_InvalidCapability → RADIO no tiene ninguna capacidad sobre los motores", tone: "accent" },
        ])
      } else if (id === "falso") {
        animate([R, G, gate("mision"), center("mision")], "delivered")
        setOutcome((o) => ({ ...o, mision: "rejected" }))
        push([
          { text: 'RADIO> seL4_Send(slot 0x02 = EP MISIÓN, "ATERRIZAR lat=-91")' },
          { text: "seL4: capacidad válida (Send) → mensaje entregado" },
          { text: "MISIÓN: latitud fuera de rango → comando rechazado", tone: "accent" },
          { text: "El kernel permite el canal autorizado; validar el contenido es trabajo de MISIÓN.", tone: "dim" },
        ])
      } else {
        animate([R, G], "blocked")
        push([
          { text: "RADIO> seL4_CNode_Mint(origen: EP VUELO, derechos: Send)" },
          { text: "seL4: seL4_FailedLookup → RADIO no tiene esa capacidad para derivarla", tone: "accent" },
          { text: "Las capacidades solo se derivan de otras que ya tenés, con iguales o menos derechos.", tone: "dim" },
        ])
      }
      return
    }

    // Kernel monolítico: el driver de RADIO corre con todos los privilegios
    if (id === "leer") {
      animate([R, center("vuelo")], "hit")
      setOutcome((o) => ({ ...o, vuelo: o.vuelo === "hijacked" ? "hijacked" : "leaked" }))
      push([
        { text: "RADIO (en el kernel)> leer 0x4000_0000" },
        { text: "kernel: no hay control de acceso entre drivers → lectura OK" },
        { text: "FILTRADO: los parámetros de vuelo salen por la radio", tone: "accent" },
      ])
    } else if (id === "motores") {
      animate([R, center("vuelo")], "hit")
      setOutcome((o) => ({ ...o, vuelo: "hijacked" }))
      push([
        { text: "RADIO (en el kernel)> escribir registro de motores = 0xFFFF" },
        { text: "kernel: escritura OK" },
        { text: "CONTROL DE VUELO: motores fuera de control", tone: "accent" },
      ])
    } else if (id === "falso") {
      animate([R, center("mision")], "hit")
      setOutcome((o) => ({ ...o, mision: "fooled" }))
      push([
        { text: "RADIO (en el kernel)> escribir la ruta directo en la memoria de MISIÓN" },
        { text: "MISIÓN: ruta reemplazada sin pasar por su validación", tone: "accent" },
      ])
    } else {
      animate([R, [380, KERNEL_Y + 30]], "hit")
      setOutcome((o) => ({ ...o, kernel: "owned" }))
      push([
        { text: "RADIO (en el kernel)> modificar credenciales del proceso: uid = 0" },
        { text: "kernel: OK → el atacante es root y controla todo el sistema", tone: "accent" },
      ])
    }
  }

  const status = (() => {
    if (outcome.vuelo === "hijacked") return { text: "DRON FUERA DE CONTROL", bad: true }
    if (outcome.kernel === "owned") return { text: "KERNEL TOMADO", bad: true }
    if (outcome.vuelo === "leaked" || outcome.mision === "fooled") return { text: "SISTEMA COMPROMETIDO", bad: true }
    if (compromised) return { text: "RADIO COMPROMETIDA · RESTO INTACTO", bad: false }
    return { text: "EN VUELO ESTABLE", bad: false }
  })()

  const nodeState = (id: NodeId): { tag: string; style: "normal" | "compromised" | "breached" | "note" } => {
    if (id === "radio" && compromised) return { tag: "COMPROMETIDA", style: "compromised" }
    if (id === "vuelo" && outcome.vuelo === "hijacked") return { tag: "SIN CONTROL", style: "breached" }
    if (id === "vuelo" && outcome.vuelo === "leaked") return { tag: "FILTRADO", style: "breached" }
    if (id === "mision" && outcome.mision === "fooled") return { tag: "ENGAÑADA", style: "breached" }
    if (id === "mision" && outcome.mision === "rejected") return { tag: "RECHAZÓ EL COMANDO", style: "note" }
    if (mode === "mono" && outcome.kernel === "owned") return { tag: "EXPUESTO", style: "breached" }
    return { tag: "OK", style: "normal" }
  }

  const attempted = lastAttack ? ATTACKS.find((a) => a.id === lastAttack) : null

  return (
    <SimWindow title="drone.sel4" right={<span className="text-[10px] tracking-widest font-mono text-muted-foreground">HACMS</span>}>
      <SimToolbar>
        <Segmented<Mode>
          label="Kernel"
          value={mode}
          onChange={(m) => reset(m)}
          options={[
            { value: "sel4", label: "seL4 · capacidades" },
            { value: "mono", label: "Monolítico (típico)" },
          ]}
        />
        <span
          className={cn(
            "text-[10px] tracking-[0.15em] uppercase font-mono px-3 py-2",
            status.bad ? "bg-[#ea580c] text-white" : "bg-foreground text-background",
          )}
        >
          {status.text}
        </span>
      </SimToolbar>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col xl:border-r-2 border-foreground">
          {/* Diagrama */}
          <div className="p-4">
            <svg viewBox="0 0 760 370" className="w-full h-auto" role="img" aria-label="Componentes del dron sobre el kernel">
              <defs>
                <pattern id="hatch-accent" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="hsl(var(--background))" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#ea580c" strokeWidth="3" strokeOpacity={0.3} />
                </pattern>
              </defs>

              {/* Zona de kernel en modo monolítico */}
              {mode === "mono" && (
                <g>
                  <rect x={12} y={12} width={736} height={346} fill="#ea580c" fillOpacity={0.06} stroke="#ea580c" strokeWidth={1.5} strokeDasharray="6 4" />
                  <text x={736} y={30} textAnchor="end" fontSize={10} fill="#ea580c" fontFamily="var(--font-mono), monospace" letterSpacing="0.1em">
                    TODO CORRE EN MODO KERNEL
                  </text>
                </g>
              )}

              {/* Canales autorizados (endpoints) */}
              {[
                ["radio", "mision"],
                ["camara", "mision"],
                ["mision", "vuelo"],
              ].map(([a, b]) => {
                const A = node(a as NodeId)
                const B = node(b as NodeId)
                const x1 = A.x + W
                const y1 = A.y + H / 2
                const x2 = B.x
                const y2 = B.y + H / 2
                return (
                  <g key={`${a}-${b}`}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray={mode === "sel4" ? "6 3" : "2 4"} opacity={mode === "sel4" ? 1 : 0.35} />
                    {mode === "sel4" && (
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" fontFamily="var(--font-mono), monospace">
                        EP · Send
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Llamadas al kernel */}
              {mode === "sel4" &&
                NODES.map((n) => (
                  <line key={`sys-${n.id}`} x1={n.x + W / 2} y1={n.y + H} x2={n.x + W / 2} y2={KERNEL_Y} stroke="hsl(var(--border))" strokeWidth={1} />
                ))}

              {/* Componentes */}
              {NODES.map((n) => {
                const st = nodeState(n.id)
                const fill =
                  st.style === "compromised" ? "url(#hatch-accent)" : st.style === "breached" ? "#ea580c" : "hsl(var(--background))"
                const fg = st.style === "breached" ? "#ffffff" : "hsl(var(--foreground))"
                return (
                  <g key={n.id} onClick={() => setSelected(n.id)} style={{ cursor: "pointer" }}>
                    <rect
                      x={n.x}
                      y={n.y}
                      width={W}
                      height={H}
                      fill={fill}
                      stroke={selected === n.id ? "#ea580c" : "hsl(var(--foreground))"}
                      strokeWidth={selected === n.id ? 3 : 2}
                    />
                    <text x={n.x + 12} y={n.y + 22} fontSize={12} fontWeight={700} fill={fg} fontFamily="var(--font-mono), monospace" letterSpacing="0.05em">
                      {n.label}
                    </text>
                    <text x={n.x + 12} y={n.y + 38} fontSize={9} fill={st.style === "breached" ? "#ffffff" : "hsl(var(--muted-foreground))"} fontFamily="var(--font-mono), monospace">
                      {n.sub}
                    </text>
                    <rect x={n.x + 12} y={n.y + 48} width={st.tag.length * 6.2 + 12} height={16} fill={st.style === "normal" ? "hsl(var(--foreground))" : st.style === "breached" ? "#ffffff" : "#ea580c"} />
                    <text
                      x={n.x + 18}
                      y={n.y + 60}
                      fontSize={9}
                      fill={st.style === "breached" ? "#ea580c" : st.style === "normal" ? "hsl(var(--background))" : "#ffffff"}
                      fontFamily="var(--font-mono), monospace"
                      letterSpacing="0.05em"
                    >
                      {st.tag}
                    </text>
                  </g>
                )
              })}

              {/* Kernel */}
              <rect x={20} y={KERNEL_Y} width={720} height={64} fill="hsl(var(--foreground))" />
              <text x={380} y={KERNEL_Y + 28} textAnchor="middle" fontSize={13} fontWeight={700} fill="hsl(var(--background))" fontFamily="var(--font-mono), monospace" letterSpacing="0.12em">
                {mode === "sel4" ? "seL4 · MICROKERNEL VERIFICADO" : "KERNEL MONOLÍTICO"}
              </text>
              <text x={380} y={KERNEL_Y + 46} textAnchor="middle" fontSize={9} fill="hsl(var(--background))" opacity={0.7} fontFamily="var(--font-mono), monospace">
                {mode === "sel4"
                  ? "verifica la capacidad en cada llamada · drivers fuera del kernel"
                  : "drivers y módulos comparten memoria y privilegios"}
              </text>

              {/* Animación del ataque */}
              {anim && (
                <g key={anim.key}>
                  <motion.circle
                    r={6}
                    fill="#ea580c"
                    initial={{ cx: anim.path[0][0], cy: anim.path[0][1] }}
                    animate={{
                      cx: anim.path.map((p) => p[0]),
                      cy: anim.path.map((p) => p[1]),
                      opacity: anim.end === "blocked" ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.45 * anim.path.length,
                      ease: "linear",
                      opacity: { duration: 0.3, delay: 0.45 * anim.path.length },
                    }}
                  />
                  {anim.end === "blocked" && (
                    <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45 * anim.path.length }}>
                      <rect x={anim.path.at(-1)![0] - 46} y={anim.path.at(-1)![1] - 34} width={92} height={20} fill="#ea580c" />
                      <text x={anim.path.at(-1)![0]} y={anim.path.at(-1)![1] - 20} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ffffff" fontFamily="var(--font-mono), monospace">
                        ✕ DENEGADO
                      </text>
                    </motion.g>
                  )}
                </g>
              )}
            </svg>
          </div>

          {/* Acciones */}
          <div className="border-t-2 border-foreground p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono w-14">Paso 1</span>
              <CtrlButton variant="accent" onClick={compromise} disabled={compromised}>
                <Skull size={12} />
                Mandar un paquete malicioso a la RADIO
              </CtrlButton>
              <CtrlButton onClick={() => reset()}>
                <RotateCcw size={12} />
                Reiniciar
              </CtrlButton>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono w-14">Paso 2</span>
              {ATTACKS.map((a) => (
                <CtrlButton key={a.id} onClick={() => attack(a.id)} disabled={!compromised}>
                  {a.label}
                </CtrlButton>
              ))}
            </div>
            {!compromised && (
              <span className="text-[11px] font-mono text-muted-foreground">
                Primero comprometé la RADIO: es el componente expuesto a la red.
              </span>
            )}
          </div>
        </div>

        {/* CSpace */}
        <div className="flex flex-col border-t-2 xl:border-t-0 border-foreground">
          <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-2">
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono">
              {mode === "sel4" ? `cspace.${selected}` : "permisos.kernel"}
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground font-mono">CAPACIDADES</span>
          </div>
          {mode === "sel4" ? (
            <>
              <div className="flex flex-wrap border-b-2 border-foreground">
                {NODES.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelected(n.id)}
                    className={cn(
                      "flex-1 px-2 py-2 text-[9px] tracking-[0.12em] uppercase font-mono border-r border-foreground last:border-r-0",
                      selected === n.id ? "bg-foreground text-background" : "hover:bg-muted",
                    )}
                  >
                    {n.id === "vuelo" ? "VUELO" : n.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col px-4 py-2">
                <div className="grid grid-cols-[44px_1fr_56px] gap-2 border-b border-border pb-2 mb-1">
                  {["Slot", "Objeto", "Derechos"].map((h) => (
                    <span key={h} className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground font-mono">
                      {h}
                    </span>
                  ))}
                </div>
                {CSPACE[selected].map((c) => {
                  const used = selected === "radio" && attempted?.wants === c.obj
                  return (
                    <div key={c.slot} className={cn("grid grid-cols-[44px_1fr_56px] gap-2 py-2 border-b border-border last:border-none", used && "bg-[#ea580c]/10")}>
                      <span className="text-xs font-mono text-muted-foreground">{c.slot}</span>
                      <span className="text-xs font-mono text-foreground">{c.obj}</span>
                      <span className="text-xs font-mono text-foreground text-right">{c.rights}</span>
                    </div>
                  )
                })}
                {selected === "radio" && attempted && !CSPACE.radio.some((c) => c.obj === attempted.wants) && (
                  <div className="mt-3 border-2 border-[#ea580c] p-3 flex flex-col gap-1">
                    <span className="text-[9px] tracking-[0.15em] uppercase text-[#ea580c] font-mono">Lo que intentó usar</span>
                    <span className="text-xs font-mono text-foreground">{attempted.wants}</span>
                    <span className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                      No está en la CSpace de RADIO. Sin capacidad, para el kernel ese objeto no existe.
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-auto px-4 py-3 border-t border-border text-[11px] font-mono text-muted-foreground leading-relaxed">
                Cada componente solo puede invocar lo que está en su CSpace. Hacé clic en un componente del diagrama para ver
                la suya.
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-3 p-4">
              <span className="font-pixel text-2xl text-[#ea580c]">SIN CAPACIDADES</span>
              <p className="text-xs font-mono text-foreground leading-relaxed">
                En un kernel monolítico (como Linux o Windows), los drivers se cargan dentro del kernel y comparten su espacio de
                memoria y sus privilegios.
              </p>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                No hay una tabla que diga qué puede tocar cada driver: un bug en el de la radio le da al atacante el mismo poder
                que al kernel entero.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t-2 border-foreground">
        <SimLog lines={log} title={mode === "sel4" ? "sel4.log" : "kernel.log"} empty="> dron en vuelo. esperando eventos..." />
      </div>
    </SimWindow>
  )
}
