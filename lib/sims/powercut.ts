/**
 * Modelo simplificado de un corte de energía mientras se guarda un archivo.
 * dosFs (FAT) sobrescribe los bloques en el lugar; HRFS escribe en bloques libres
 * (copy-on-write) y recién al final hace un commit atómico de la raíz.
 */

export const STEP_TICKS = 3
export const BLOCKS = 32

export const V1 = ["MODO=CRUCERO", "VEL=120", "ALT=3000"]
export const V2 = ["MODO=ATERRIZAR", "VEL=080", "ALT=0500"]

export type BlockKind = "free" | "meta" | "other" | "v1" | "v2" | "writing" | "torn" | "stale"

export interface Block {
  kind: BlockKind
  label: string
}

export interface FsStep {
  text: string
  block: number
  kind: "data" | "meta"
  label: string
  /** índice del bloque lógico del archivo (0..2) si es un bloque de datos */
  part?: number
}

export const FAT_STEPS: FsStep[] = [
  { text: "Sobrescribir bloque 1 de config.dat en el lugar", block: 8, kind: "data", label: "v2", part: 0 },
  { text: "Sobrescribir bloque 2 en el lugar", block: 9, kind: "data", label: "v2", part: 1 },
  { text: "Sobrescribir bloque 3 en el lugar", block: 10, kind: "data", label: "v2", part: 2 },
  { text: "Actualizar la entrada de directorio (fecha y tamaño)", block: 3, kind: "meta", label: "DIR" },
]

export const HRFS_STEPS: FsStep[] = [
  { text: "Escribir bloque 1 nuevo en un bloque libre", block: 16, kind: "data", label: "v2", part: 0 },
  { text: "Escribir bloque 2 nuevo en un bloque libre", block: 17, kind: "data", label: "v2", part: 1 },
  { text: "Escribir bloque 3 nuevo en un bloque libre", block: 18, kind: "data", label: "v2", part: 2 },
  { text: "Escribir el inodo nuevo (apunta a los bloques nuevos)", block: 2, kind: "meta", label: "INO2" },
  { text: "COMMIT: mover la raíz al inodo nuevo (atómico)", block: 0, kind: "meta", label: "RAÍZ" },
]

export const TOTAL_TICKS = Math.max(FAT_STEPS.length, HRFS_STEPS.length) * STEP_TICKS

function baseLayout(fs: "fat" | "hrfs"): Block[] {
  const b: Block[] = Array.from({ length: BLOCKS }, () => ({ kind: "free" as BlockKind, label: "" }))
  const other = [4, 5, 12, 13, 21, 22]
  other.forEach((i) => (b[i] = { kind: "other", label: "otro" }))
  if (fs === "fat") {
    b[0] = { kind: "meta", label: "BOOT" }
    b[1] = { kind: "meta", label: "FAT" }
    b[2] = { kind: "meta", label: "FAT2" }
    b[3] = { kind: "meta", label: "DIR" }
  } else {
    b[0] = { kind: "meta", label: "RAÍZ" }
    b[1] = { kind: "meta", label: "INO1" }
  }
  b[8] = { kind: "v1", label: "v1" }
  b[9] = { kind: "v1", label: "v1" }
  b[10] = { kind: "v1", label: "v1" }
  return b
}

export type StepStatus = "pending" | "active" | "done" | "interrupted"

export interface DiskState {
  blocks: Block[]
  steps: StepStatus[]
  completed: number
  partial: number | null
}

/** Estado de un disco tras `ticks` ticks de escritura; si `cut` es true, la escritura en curso queda cortada. */
export function diskAt(fs: "fat" | "hrfs", ticks: number, cut: boolean): DiskState {
  const steps = fs === "fat" ? FAT_STEPS : HRFS_STEPS
  const blocks = baseLayout(fs)
  const completed = Math.min(Math.floor(ticks / STEP_TICKS), steps.length)
  const partial = completed < steps.length && ticks % STEP_TICKS > 0 ? completed : null

  for (let i = 0; i < completed; i++) {
    const s = steps[i]
    blocks[s.block] = { kind: s.kind === "data" ? "v2" : "meta", label: s.label }
  }
  if (partial !== null) {
    const s = steps[partial]
    blocks[s.block] = cut ? { kind: "torn", label: "▒▒" } : { kind: "writing", label: "···" }
  }
  // Tras el commit de HRFS, los bloques viejos quedan libres para reutilizar
  if (fs === "hrfs" && completed === steps.length) {
    ;[1, 8, 9, 10].forEach((i) => (blocks[i] = { kind: "stale", label: "libre" }))
  }

  const status: StepStatus[] = steps.map((_, i) => {
    if (i < completed) return "done"
    if (i === partial) return cut ? "interrupted" : "active"
    return "pending"
  })
  return { blocks, steps: status, completed, partial }
}

export type Verdict = "ok-old" | "ok-new" | "inconsistent" | "corrupt"

export interface Recovery {
  verdict: Verdict
  title: string
  detail: string
  readback: string
  torn: boolean[]
}

function tornText(s: string) {
  return s.slice(0, Math.ceil(s.length / 2)) + "▒▒▒"
}

export function recoverFat(ticks: number): Recovery {
  const { completed, partial } = diskAt("fat", ticks, true)
  const parts = [0, 1, 2].map((i) => (i < completed ? "new" : i === partial ? "torn" : "old"))
  const text = parts.map((p, i) => (p === "new" ? V2[i] : p === "torn" ? tornText(V2[i]) : V1[i])).join("  ")
  const torn = parts.map((p) => p === "torn")
  const dirDone = completed >= 4
  const dirTorn = partial === 3

  if (parts.every((p) => p === "old")) {
    return { verdict: "ok-old", title: "OK · VERSIÓN ANTERIOR", detail: "El corte llegó antes de tocar el disco: el archivo quedó como estaba.", readback: text, torn }
  }
  if (parts.every((p) => p === "new") && dirDone) {
    return { verdict: "ok-new", title: "OK · VERSIÓN NUEVA", detail: "Llegó a escribir todo antes del corte.", readback: text, torn }
  }
  if (parts.every((p) => p === "new")) {
    return {
      verdict: "inconsistent",
      title: dirTorn ? "DIRECTORIO DAÑADO" : "INCONSISTENTE",
      detail: dirTorn
        ? "Se cortó escribiendo la entrada de directorio: hay que correr chkdsk y puede perderse el archivo entero."
        : "Los datos son nuevos pero la fecha y el tamaño son viejos. chkdsk tiene que revisar el volumen.",
      readback: text,
      torn,
    }
  }
  return {
    verdict: "corrupt",
    title: "CORRUPTO",
    detail: "El archivo mezcla la versión vieja con la nueva. Ningún programa sabe que está mal: lo va a leer como válido.",
    readback: text,
    torn,
  }
}

export function recoverHrfs(ticks: number): Recovery {
  const { completed } = diskAt("hrfs", ticks, true)
  if (completed >= HRFS_STEPS.length) {
    return { verdict: "ok-new", title: "OK · VERSIÓN NUEVA", detail: "El commit se completó: la versión nueva es la oficial.", readback: V2.join("  "), torn: [false, false, false] }
  }
  return {
    verdict: "ok-old",
    title: "OK · ROLLBACK AL ÚLTIMO COMMIT",
    detail:
      "La raíz sigue apuntando al inodo viejo. Al montar, HRFS ignora los bloques sin confirmar: se pierde solo el cambio, nunca la consistencia.",
    readback: V1.join("  "),
    torn: [false, false, false],
  }
}
