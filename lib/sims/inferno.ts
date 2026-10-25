/**
 * Modelo didáctico de Inferno: sistema de archivos virtual, namespaces por proceso,
 * bind/mount con directorios unión y los mensajes Styx (9P2000) que genera cada
 * operación sobre una máquina remota. No es Inferno: imita su comportamiento visible.
 */

export type Machine = "local" | "lab"

interface Io {
  print: (s: string) => void
  lab: (s: string) => void
}

export interface FileNode {
  kind: "file"
  read?: () => string
  write?: (data: string, io: Io) => void
}
export interface DirNode {
  kind: "dir"
  children: Record<string, Node> | (() => Record<string, Node>)
}
export type Node = FileNode | DirNode

export interface Source {
  machine: Machine
  root: string
  attachFid?: number
  addr?: string
}

export interface NsEntry {
  target: string
  source: Source
  flag: "repl" | "a" | "b"
  text: string
}

export interface Proc {
  pid: number
  name: string
  ns: NsEntry[]
  cwd: string
}

export type LineTone = "out" | "err" | "sys"
export interface OutLine {
  text: string
  tone: LineTone
}

export type MonitorKind = "T" | "R" | "Rerror" | "local" | "info"
export interface MonitorMsg {
  kind: MonitorKind
  text: string
}

export interface ExecResult {
  out: OutLine[]
  monitor: MonitorMsg[]
  lab: string[]
  clear?: boolean
}

/* ── helpers de árbol ── */

const dir = (children: DirNode["children"]): DirNode => ({ kind: "dir", children })
const file = (read?: () => string, write?: FileNode["write"]): FileNode => ({ kind: "file", read, write })
const children = (d: DirNode) => (typeof d.children === "function" ? d.children() : d.children)

export function splitPath(p: string): string[] {
  return p.split("/").filter(Boolean)
}

export function normalize(cwd: string, p: string): string {
  const base = p.startsWith("/") ? [] : splitPath(cwd)
  for (const c of splitPath(p)) {
    if (c === ".") continue
    if (c === "..") base.pop()
    else base.push(c)
  }
  return "/" + base.join("/")
}

function walk(node: Node | null, comps: string[]): Node | null {
  let n = node
  for (const c of comps) {
    if (!n || n.kind !== "dir") return null
    n = children(n)[c] ?? null
  }
  return n
}

function qid(path: string, isDir: boolean) {
  let h = 0
  for (const ch of path) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `(${h.toString(16).padStart(8, "0")} 0 ${isDir ? "d" : ""})`.replace(" )", ")")
}

function preview(s: string) {
  const one = s.replace(/\n/g, "\\n")
  return one.length > 28 ? one.slice(0, 28) + "…" : one
}

const DIS_FILE = (name: string) =>
  file(
    () =>
      `${name}: módulo Dis (bytecode portable, XMAGIC 819248).\nEl mismo archivo corre en x86, ARM o hospedado sobre Windows y Linux.`,
  )

/* ── el mundo simulado ── */

export class InfernoWorld {
  procs: Record<number, Proc>
  private tag = 1
  private fid = 1
  private local: DirNode
  private devices: Record<string, DirNode>
  private labRoot: DirNode

  constructor() {
    this.local = dir({
      dev: dir({}),
      net: dir({}),
      prog: dir({}),
      env: dir({}),
      dis: dir(
        Object.fromEntries(
          ["sh", "ls", "cat", "echo", "bind", "mount", "unmount", "ns", "date", "ps"].map((c) => [`${c}.dis`, DIS_FILE(`${c}.dis`)]),
        ),
      ),
      usr: dir({
        invitado: dir({
          "notas.txt": file(() => "En Inferno todo recurso es un archivo.\nProbá: cat /dev/time"),
        }),
      }),
      n: dir({ lab: dir({}) }),
    })

    this.devices = {
      "#c": dir({
        cons: file(
          () => "(cons: lee del teclado; no disponible en la simulación)",
          (d, io) => io.print(d),
        ),
        time: file(() => String(Date.now() * 1000)),
        sysname: file(() => "terminal"),
        user: file(() => "invitado"),
        random: file(() =>
          Array.from({ length: 12 }, () =>
            Math.floor(Math.random() * 256)
              .toString(16)
              .padStart(2, "0"),
          ).join(" "),
        ),
        drivers: file(() => "#/ root\n#c cons\n#e env\n#I ip\n#M mnt\n#p prog"),
      }),
      "#I": dir({
        tcp: dir({
          clone: file(() => "0"),
          "0": dir({
            ctl: file(() => "0"),
            status: file(() => "Established"),
            local: file(() => "10.0.0.2!40412"),
            remote: file(() => "10.0.0.7!6666"),
          }),
        }),
        udp: dir({ clone: file(() => "1") }),
        cs: file(() => "servidor de nombres: tcp!lab!styx → tcp!10.0.0.7!6666"),
      }),
      "#p": dir(() =>
        Object.fromEntries(
          Object.values(this.procs).map((p) => [
            String(p.pid),
            dir({
              status: file(() => `${p.pid}  invitado  ${p.name}`),
              ns: file(() => this.nsText(p)),
            }),
          ]),
        ),
      ),
      "#e": dir({
        user: file(() => "invitado"),
        sysname: file(() => "terminal"),
        home: file(() => "/usr/invitado"),
      }),
    }

    this.labRoot = dir({
      dev: dir({
        sysname: file(() => "servidor-lab"),
        cons: file(
          () => "(cons de servidor-lab: lee de su teclado)",
          (d, io) => io.lab(d),
        ),
        time: file(() => String(Date.now() * 1000)),
        sensor: dir({
          temp: file(() => `${(23 + Math.random()).toFixed(1)} °C`),
          humedad: file(() => `${Math.round(45 + Math.random() * 3)} %`),
        }),
      }),
      usr: dir({
        lab: dir({ "datos.csv": file(() => "hora,temp\n20:00,23.1\n20:05,23.4\n20:10,23.7") }),
      }),
    })

    const base = (target: string, root: string, text: string): NsEntry => ({
      target,
      source: { machine: "local", root },
      flag: "repl",
      text,
    })

    this.procs = {
      12: {
        pid: 12,
        name: "sh",
        cwd: "/",
        ns: [
          base("/", "/", "bind / /"),
          base("/dev", "#c", "bind '#c' /dev"),
          base("/net", "#I", "bind '#I' /net"),
          base("/prog", "#p", "bind '#p' /prog"),
          base("/env", "#e", "bind '#e' /env"),
        ],
      },
      31: {
        pid: 31,
        name: "sandbox",
        cwd: "/",
        ns: [base("/", "/", "bind / /"), base("/dev", "#c", "bind '#c' /dev"), base("/env", "#e", "bind '#e' /env")],
      },
    }
  }

  nsText(p: Proc) {
    return p.ns.map((e) => e.text).join("\n")
  }

  /* ── resolución de nombres ── */

  private rootNode(src: Source): Node | null {
    if (src.machine === "lab") return walk(this.labRoot, splitPath(src.root))
    if (src.root.startsWith("#")) {
      const [dev, ...rest] = src.root.split("/").filter(Boolean)
      return walk(this.devices[dev] ?? null, rest)
    }
    return walk(this.local, splitPath(src.root))
  }

  private bestTarget(p: Proc, path: string) {
    let best = "/"
    for (const e of p.ns) {
      const t = e.target
      if ((path === t || path.startsWith(t === "/" ? "/" : t + "/")) && t.length > best.length) best = t
    }
    return best
  }

  private union(p: Proc, target: string): Source[] {
    let list: Source[] = []
    for (const e of p.ns) {
      if (e.target !== target) continue
      if (e.flag === "repl") list = [e.source]
      else if (e.flag === "a") list.push(e.source)
      else list.unshift(e.source)
    }
    return list
  }

  /** Busca un camino en el namespace del proceso. */
  lookup(p: Proc, path: string) {
    const target = this.bestTarget(p, path)
    const rest = splitPath(path).slice(splitPath(target).length)
    let failedLab: { source: Source; comps: string[] } | null = null
    for (const s of this.union(p, target)) {
      const n = walk(this.rootNode(s), rest)
      const comps = s.machine === "lab" ? [...splitPath(s.root), ...rest] : rest
      if (n) return { node: n, source: s, comps, rest, failedLab: null }
      if (s.machine === "lab" && !failedLab) failedLab = { source: s, comps }
    }
    return { node: null, source: null, comps: [], rest, failedLab }
  }

  /* ── mensajes Styx ── */

  private t() {
    return this.tag++
  }

  private walkMsgs(src: Source, comps: string[], fid: number): MonitorMsg[] {
    const tag = this.t()
    const names = comps.map((c, i) => `${i}:${c}`).join(" ")
    return [
      { kind: "T", text: `Twalk tag ${tag} fid ${src.attachFid} newfid ${fid} nwname ${comps.length}${names ? " " + names : ""}` },
      { kind: "R", text: `Rwalk tag ${tag} nwqid ${comps.length}` },
    ]
  }

  private readMsgs(src: Source, comps: string[], data: string, isDir: boolean): MonitorMsg[] {
    const fid = this.fid++
    const msgs = this.walkMsgs(src, comps, fid)
    const t1 = this.t()
    msgs.push({ kind: "T", text: `Topen tag ${t1} fid ${fid} mode 0` })
    msgs.push({ kind: "R", text: `Ropen tag ${t1} qid ${qid(comps.join("/"), isDir)} iounit 8192` })
    const t2 = this.t()
    const len = new TextEncoder().encode(data).length
    msgs.push({ kind: "T", text: `Tread tag ${t2} fid ${fid} offset 0 count 8192` })
    msgs.push({ kind: "R", text: `Rread tag ${t2} count ${len} '${preview(data)}'` })
    const t3 = this.t()
    msgs.push({ kind: "T", text: `Tread tag ${t3} fid ${fid} offset ${len} count 8192` })
    msgs.push({ kind: "R", text: `Rread tag ${t3} count 0` })
    const t4 = this.t()
    msgs.push({ kind: "T", text: `Tclunk tag ${t4} fid ${fid}` })
    msgs.push({ kind: "R", text: `Rclunk tag ${t4}` })
    return msgs
  }

  private writeMsgs(src: Source, comps: string[], data: string): MonitorMsg[] {
    const fid = this.fid++
    const msgs = this.walkMsgs(src, comps, fid)
    const t1 = this.t()
    msgs.push({ kind: "T", text: `Topen tag ${t1} fid ${fid} mode 1` })
    msgs.push({ kind: "R", text: `Ropen tag ${t1} qid ${qid(comps.join("/"), false)} iounit 8192` })
    const t2 = this.t()
    const len = new TextEncoder().encode(data).length
    msgs.push({ kind: "T", text: `Twrite tag ${t2} fid ${fid} offset 0 count ${len} '${preview(data)}'` })
    msgs.push({ kind: "R", text: `Rwrite tag ${t2} count ${len}` })
    const t3 = this.t()
    msgs.push({ kind: "T", text: `Tclunk tag ${t3} fid ${fid}` })
    msgs.push({ kind: "R", text: `Rclunk tag ${t3}` })
    return msgs
  }

  private errorWalk(f: { source: Source; comps: string[] }): MonitorMsg[] {
    const tag = this.t()
    const fid = this.fid++
    const names = f.comps.map((c, i) => `${i}:${c}`).join(" ")
    return [
      { kind: "T", text: `Twalk tag ${tag} fid ${f.source.attachFid} newfid ${fid} nwname ${f.comps.length} ${names}` },
      { kind: "Rerror", text: `Rerror tag ${tag} ename 'file does not exist'` },
    ]
  }

  private localNote(path: string, src: Source | null): MonitorMsg[] {
    if (!src || src.machine !== "local" || !src.root.startsWith("#")) return []
    return [{ kind: "local", text: `${path} → dispositivo ${src.root.split("/")[0]} del kernel local (sin red)` }]
  }

  /* ── intérprete ── */

  exec(pid: number, raw: string): ExecResult {
    const p = this.procs[pid]
    const res: ExecResult = { out: [], monitor: [], lab: [] }
    const out = (text: string, tone: LineTone = "out") => text.split("\n").forEach((l) => res.out.push({ text: l, tone }))
    const err = (text: string) => out(text, "err")
    const io: Io = { print: (s) => out(s), lab: (s) => res.lab.push(s) }

    const tokens = [...raw.matchAll(/'([^']*)'|"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3])
    if (tokens.length === 0) return res
    const [cmd, ...args] = tokens
    const abs = (x: string) => (x.startsWith("#") ? x : normalize(p.cwd, x))

    const notFound = (c: string, path: string, f: ReturnType<InfernoWorld["lookup"]>["failedLab"]) => {
      if (f) res.monitor.push(...this.errorWalk(f))
      err(`${c}: ${path}: '${path}' does not exist`)
    }

    switch (cmd) {
      case "help":
      case "ayuda": {
        out(
          [
            "comandos: ls cat echo cd pwd bind mount unmount ns ps date clear help",
            "",
            "  cat /dev/sysname                 leer un dispositivo",
            "  mount tcp!lab!styx /n/lab        montar otra máquina",
            "  ls /n/lab/dev                    listar un directorio remoto",
            "  echo hola > /n/lab/dev/cons      escribir en la consola remota",
            "  bind -a /n/lab/dev/sensor /dev   unir un directorio a /dev",
            "  ns                               ver el namespace del proceso",
          ].join("\n"),
          "sys",
        )
        break
      }
      case "clear":
        res.clear = true
        break
      case "pwd":
        out(p.cwd)
        break
      case "cd": {
        const target = abs(args[0] ?? "/")
        const r = this.lookup(p, target)
        if (!r.node) notFound("cd", target, r.failedLab)
        else if (r.node.kind !== "dir") err(`cd: ${target}: not a directory`)
        else p.cwd = target
        break
      }
      case "ls": {
        const target = abs(args.find((a) => !a.startsWith("-")) ?? p.cwd)
        const best = this.bestTarget(p, target)
        const rest = splitPath(target).slice(splitPath(best).length)
        const names = new Map<string, boolean>()
        let found = false
        let firstLab: Source | null = null
        let fileHit = false
        for (const s of this.union(p, best)) {
          const n = walk(this.rootNode(s), rest)
          if (!n) continue
          found = true
          if (n.kind === "file") {
            fileHit = true
            break
          }
          for (const [k, v] of Object.entries(children(n))) names.set(k, v.kind === "dir")
          if (s.machine === "lab") {
            if (!firstLab) firstLab = s
            const comps = [...splitPath(s.root), ...rest]
            res.monitor.push(...this.readMsgs(s, comps, Object.keys(children(n)).join(" "), true))
          } else {
            res.monitor.push(...this.localNote(target, s))
          }
        }
        if (!found) {
          const r = this.lookup(p, target)
          notFound("ls", target, r.failedLab)
          break
        }
        if (fileHit) {
          out(target)
          break
        }
        const list = [...names.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, d]) => (d ? k + "/" : k))
        if (list.length) out(list.join("   "))
        else out("(directorio vacío)", "sys")
        break
      }
      case "cat": {
        if (args.length === 0) {
          err("cat: falta el nombre de un archivo")
          break
        }
        for (const a of args) {
          const target = abs(a)
          const r = this.lookup(p, target)
          if (!r.node) {
            notFound("cat", target, r.failedLab)
            continue
          }
          if (r.node.kind === "dir") {
            err(`cat: ${target}: is a directory`)
            continue
          }
          const data = r.node.read ? r.node.read() : ""
          if (r.source!.machine === "lab") res.monitor.push(...this.readMsgs(r.source!, r.comps, data, false))
          else res.monitor.push(...this.localNote(target, r.source))
          out(data)
        }
        break
      }
      case "echo": {
        const gt = args.indexOf(">")
        if (gt === -1) {
          out(args.join(" "))
          break
        }
        const text = args.slice(0, gt).join(" ")
        const dest = args[gt + 1]
        if (!dest) {
          err("echo: falta el archivo después de >")
          break
        }
        const target = abs(dest)
        const r = this.lookup(p, target)
        if (!r.node) {
          notFound("echo", target, r.failedLab)
          break
        }
        if (r.node.kind !== "file" || !r.node.write) {
          err(`echo: can't open ${target}: permission denied`)
          break
        }
        if (r.source!.machine === "lab") res.monitor.push(...this.writeMsgs(r.source!, r.comps, text))
        else res.monitor.push(...this.localNote(target, r.source))
        r.node.write(text, io)
        break
      }
      case "ns":
        out(this.nsText(p))
        break
      case "ps": {
        const r = this.lookup(p, "/prog")
        if (!r.node || r.node.kind !== "dir" || Object.keys(children(r.node)).length === 0) {
          err("ps: /prog vacío: este proceso no ve a los demás")
          break
        }
        res.monitor.push(...this.localNote("/prog", r.source))
        for (const k of Object.keys(children(r.node))) {
          const st = walk(r.node, [k, "status"])
          if (st && st.kind === "file" && st.read) out(`  ${st.read()}`)
        }
        break
      }
      case "date": {
        const r = this.lookup(p, "/dev/time")
        if (!r.node || r.node.kind !== "file") {
          err("date: '/dev/time' does not exist")
          break
        }
        res.monitor.push(...this.localNote("/dev/time", r.source))
        out(new Date().toString().slice(0, 24))
        break
      }
      case "bind": {
        const flags = args.filter((a) => /^-[abc]+$/.test(a)).join("")
        const pos = args.filter((a) => !/^-[abc]+$/.test(a))
        if (pos.length !== 2) {
          err("uso: bind [-a|-b] nuevo viejo")
          break
        }
        const [src, dst] = pos
        const oldPath = abs(dst)
        const old = this.lookup(p, oldPath)
        if (!old.node) {
          notFound("bind", oldPath, old.failedLab)
          break
        }
        let source: Source
        if (src.startsWith("#")) {
          if (!this.devices[src.split("/")[0]]) {
            err(`bind: ${src}: unknown device`)
            break
          }
          source = { machine: "local", root: src }
        } else {
          const n = this.lookup(p, abs(src))
          if (!n.node || !n.source) {
            notFound("bind", abs(src), n.failedLab)
            break
          }
          const s = n.source
          const root =
            s.machine === "lab"
              ? "/" + n.comps.join("/")
              : s.root.startsWith("#")
                ? [s.root, ...n.rest].join("/")
                : normalize("/", [s.root, ...n.rest].join("/"))
          source = { ...s, root }
        }
        const flag: NsEntry["flag"] = flags.includes("a") ? "a" : flags.includes("b") ? "b" : "repl"
        const flagText = flag === "repl" ? "" : ` -${flag}`
        p.ns.push({ target: oldPath, source, flag, text: `bind${flagText} ${src.startsWith("#") ? `'${src}'` : abs(src)} ${oldPath}` })
        res.monitor.push({ kind: "info", text: `namespace del pid ${p.pid}: ${abs(src)} unido a ${oldPath}${flag === "a" ? " (al final)" : flag === "b" ? " (al principio)" : ""}` })
        break
      }
      case "mount": {
        const noAuth = args.includes("-A")
        const flags = args.filter((a) => /^-[abcA]+$/.test(a)).join("")
        const pos = args.filter((a) => !/^-[abcA]+$/.test(a))
        if (pos.length !== 2) {
          err("uso: mount [-a|-b] [-A] tcp!máquina!styx directorio")
          break
        }
        const [addr, dst] = pos
        const m = addr.match(/^(tcp|net)!([\w.-]+)!(styx|6666)$/)
        if (!m) {
          err(`mount: ${addr}: dirección inválida (formato: tcp!lab!styx)`)
          break
        }
        const dial = this.lookup(p, "/net/tcp/clone")
        if (!dial.node) {
          err(`mount: can't dial ${addr}: '/net/tcp/clone' does not exist`)
          res.monitor.push({ kind: "info", text: `pid ${p.pid}: sin /net en su namespace → no puede abrir conexiones` })
          break
        }
        if (!["lab", "servidor-lab"].includes(m[2])) {
          err(`mount: can't dial ${addr}: host desconocido (probá con lab)`)
          break
        }
        const oldPath = abs(dst)
        const old = this.lookup(p, oldPath)
        if (!old.node || old.node.kind !== "dir") {
          err(`mount: ${oldPath}: '${oldPath}' does not exist`)
          break
        }
        const attach = this.fid++
        res.monitor.push({ kind: "info", text: `/net/tcp/clone → conexión con 10.0.0.7!6666 (servidor-lab)` })
        if (!noAuth) out("auth: certificado de 'invitado' verificado por servidor-lab", "sys")
        res.monitor.push({ kind: "T", text: "Tversion tag 65535 msize 8216 version 9P2000" })
        res.monitor.push({ kind: "R", text: "Rversion tag 65535 msize 8216 version 9P2000" })
        const tag = this.t()
        res.monitor.push({ kind: "T", text: `Tattach tag ${tag} fid ${attach} afid -1 uname invitado aname ''` })
        res.monitor.push({ kind: "R", text: `Rattach tag ${tag} qid ${qid("/", true)}` })
        const flag: NsEntry["flag"] = flags.includes("a") ? "a" : flags.includes("b") ? "b" : "repl"
        p.ns.push({
          target: oldPath,
          source: { machine: "lab", root: "/", attachFid: attach, addr },
          flag,
          text: `mount${flag === "repl" ? "" : ` -${flag}`} ${addr} ${oldPath}`,
        })
        break
      }
      case "unmount": {
        const pos = args.filter((a) => !a.startsWith("-"))
        const oldPath = abs(pos[pos.length - 1] ?? "")
        const before = p.ns.length
        p.ns = p.ns.filter((e, i) => i === 0 || e.target !== oldPath || (pos.length === 2 && !e.text.includes(pos[0])))
        if (p.ns.length === before) err(`unmount: ${oldPath}: not mounted`)
        else res.monitor.push({ kind: "info", text: `namespace del pid ${p.pid}: se quitó lo montado en ${oldPath}` })
        break
      }
      default:
        err(`sh: ${cmd}: '/dis/${cmd}.dis' does not exist`)
    }
    return res
  }
}
