import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

const LABS = [
  { href: "/sel4", name: "seL4", code: "LAB_01" },
  { href: "/vxworks", name: "VxWorks", code: "LAB_02" },
  { href: "/inferno", name: "Inferno", code: "LAB_03" },
]

/** Navegación entre laboratorios al pie de cada página. */
export function LabNav({ current }: { current: string }) {
  const i = LABS.findIndex((l) => l.href === current)
  const prev = i > 0 ? LABS[i - 1] : { href: "/", name: "Portada", code: "INICIO" }
  const next = i < LABS.length - 1 ? LABS[i + 1] : { href: "/#comparativa", name: "Comparativa", code: "FINAL" }

  return (
    <section className="w-full px-6 pb-16 lg:px-12">
      <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-foreground">
        <Link href={prev.href} className="group flex items-center gap-4 p-6 border-b-2 md:border-b-0 md:border-r-2 border-foreground hover:bg-foreground hover:text-background transition-colors">
          <ArrowLeft size={18} />
          <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.2em] uppercase opacity-60 font-mono">{prev.code}</span>
            <span className="text-lg font-mono font-bold uppercase">{prev.name}</span>
          </div>
        </Link>
        <Link href={next.href} className="group flex items-center justify-end gap-4 p-6 text-right hover:bg-foreground hover:text-background transition-colors">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.2em] uppercase opacity-60 font-mono">{next.code}</span>
            <span className="text-lg font-mono font-bold uppercase">{next.name}</span>
          </div>
          <span className="flex items-center justify-center w-10 h-10 bg-[#ea580c]">
            <ArrowRight size={18} className="text-white" />
          </span>
        </Link>
      </div>
    </section>
  )
}
