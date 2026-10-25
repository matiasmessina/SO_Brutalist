import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { OsHero } from "@/components/os/os-hero"
import { SimSection } from "@/components/os/sim-section"
import { LabNav } from "@/components/os/lab-nav"
import { PathfinderSim } from "@/components/sims/pathfinder-sim"
import { PowerCutSim } from "@/components/sims/powercut-sim"

export const metadata: Metadata = {
  title: "VxWorks",
  description: "Simulaciones de VxWorks: la inversión de prioridades del Mars Pathfinder y un corte de energía comparando FAT con HRFS.",
}

export default function VxWorksPage() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Navbar />
      <main>
        <OsHero
          code="LAB_02: VXWORKS"
          index="02"
          pixelTitle="VXWORKS"
          tagline="RTOS comercial · Wind River · desde 1987"
          description="Un sistema operativo de tiempo real no es el más rápido: es el que siempre responde a tiempo. VxWorks lleva casi 40 años en aviones, robots industriales y rovers de Marte. Acá vas a ver dos cosas que un sistema de escritorio no garantiza: que la tarea crítica cumpla su plazo aunque comparta recursos, y que un corte de luz no deje archivos a medias."
          facts={[
            { label: "Tipo", value: "RTOS comercial · VxWorks 7, versión 26.03 (mar. 2026)" },
            { label: "Empresa", value: "Wind River, subsidiaria de Aptiv desde 2022" },
            { label: "Licencia", value: "Propietaria · SDK gratis para uso no comercial" },
            { label: "Planificación", value: "Preemptiva por prioridades (0 a 255), SMP y AMP" },
            { label: "Usado en", value: "Rovers de Marte, Boeing 787, Airbus A400M, robots KUKA" },
          ]}
          metrics={[
            { value: "1987", label: "Año de lanzamiento" },
            { value: "256", label: "Niveles de prioridad" },
            { value: "100+", label: "Placas soportadas" },
            { value: "<3µs", label: "Interrupción TSN (dato del fabricante)" },
          ]}
          sims={[
            { id: "sim-03", label: "SIM 03 · Mars Pathfinder" },
            { id: "sim-04", label: "SIM 04 · Corte de luz" },
          ]}
        />

        <SimSection
          id="sim-03"
          label="// SIM 03: INVERSION_DE_PRIORIDADES"
          index="03"
          title="Mars Pathfinder: la tarea más importante esperando a la menos importante"
          intro={
            <>
              <p>
                En julio de 1997, días después de aterrizar en Marte, el Pathfinder empezó a reiniciarse solo. Corría
                VxWorks. No era un error del sistema operativo sino de configuración: una tarea de baja prioridad
                (meteorología) tenía tomado un mutex que necesitaba la tarea de alta prioridad (bc_dist), y una tarea de
                prioridad media (comunicaciones) se metía en el medio y no la dejaba soltarlo.
              </p>
              <p>
                Eso se llama inversión de prioridades. La solución fue activar la herencia de prioridad: mientras una tarea
                baja tiene un mutex que una alta necesita, sube temporalmente a la prioridad de la alta.
              </p>
            </>
          }
          howTo={[
            "Dejá el modo Sin herencia y apretá Reproducir.",
            "Mirá t=03: bc_dist se bloquea y comm se queda con la CPU.",
            "En t=14 el watchdog reinicia el sistema.",
            "Cambiá a Con herencia y repetí: ASI/MET sube a prioridad 10 y todo termina a tiempo.",
          ]}
          takeaways={[
            {
              label: "Qué demuestra",
              text: "Tener más prioridad no alcanza si se comparten recursos. Un RTOS tiene que ofrecer mecanismos como la herencia de prioridad para que los plazos se cumplan de forma predecible.",
            },
            {
              label: "En tu SO de todos los días",
              text: "En una PC, una inversión de prioridades se nota como un tirón de medio segundo y nadie se entera. En un sistema de tiempo real llegar tarde es una falla: el watchdog reinicia todo.",
            },
            {
              label: "Límite de la simulación",
              text: "Tres tareas y tiempos elegidos para que se vea en 20 ticks. El caso real tenía más tareas y el mutex estaba dentro del mecanismo select() de VxWorks.",
            },
          ]}
        >
          <PathfinderSim />
        </SimSection>

        <SimSection
          id="sim-04"
          label="// SIM 04: CORTE_DE_ENERGIA"
          index="04"
          title="Cortá la luz mientras se guarda un archivo"
          intro={
            <>
              <p>
                Casi todo el mundo tuvo un pendrive o una tarjeta SD con archivos rotos. Pasa porque FAT escribe
                directamente sobre los bloques del archivo: si la energía se corta en el medio, queda una mezcla de la
                versión vieja y la nueva.
              </p>
              <p>
                HRFS (Highly Reliable File System), el sistema de archivos transaccional de VxWorks, nunca pisa los datos
                confirmados: escribe en bloques libres y al final hace un commit atómico. Si se corta antes, al montar
                vuelve al último commit. La política de commit es configurable.
              </p>
            </>
          }
          howTo={[
            "Apretá Guardar config.dat: los dos discos escriben la misma actualización.",
            "Mientras escribe, apretá Cortar la luz.",
            "Apretá Encender y montar y compará qué quedó en cada disco.",
            "Probá cortar en distintos momentos: FAT casi siempre queda mal, HRFS nunca.",
          ]}
          takeaways={[
            {
              label: "Qué demuestra",
              text: "La diferencia entre escribir en el lugar y escribir con transacciones. En un equipo que puede perder energía en cualquier momento, un archivo de configuración a medias es peor que perderlo.",
            },
            {
              label: "En tu SO de todos los días",
              text: "NTFS, ext4 y APFS usan journaling o copy-on-write y protegen sus metadatos. Pero los pendrives y las tarjetas SD suelen venir en FAT o exFAT, que no tienen esa protección.",
            },
            {
              label: "Límite de la simulación",
              text: "Discos de 32 bloques y un archivo de tres. El HRFS real agrupa varias operaciones por transacción según la política de commit configurada.",
            },
          ]}
        >
          <PowerCutSim />
        </SimSection>

        <LabNav current="/vxworks" />
      </main>
      <Footer />
    </div>
  )
}
