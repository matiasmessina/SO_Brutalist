import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { OsHero } from "@/components/os/os-hero"
import { SimSection } from "@/components/os/sim-section"
import { LabNav } from "@/components/os/lab-nav"
import { DroneSim } from "@/components/sims/drone-sim"
import { McsSim } from "@/components/sims/mcs-sim"

export const metadata: Metadata = {
  title: "seL4",
  description: "Simulaciones de seL4: aislamiento por capacidades frente a un kernel monolítico y presupuestos de CPU con MCS.",
}

export default function Sel4Page() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Navbar />
      <main>
        <OsHero
          code="LAB_01: SEL4"
          index="01"
          pixelTitle="SEL4"
          tagline="Microkernel verificado · seL4 Foundation · open source"
          description="seL4 es un microkernel: casi todo lo que en Windows o Linux vive dentro del kernel (drivers, red, sistemas de archivos) acá corre afuera, como componentes aislados. Lo que lo hace único es una prueba matemática, verificada por computadora, de que su código hace exactamente lo que dice su especificación y de que una aplicación no puede afectar a otra sin permiso. En este laboratorio vas a ver ese aislamiento frente a un ataque, y cómo se aísla también el tiempo de CPU."
          facts={[
            { label: "Tipo", value: "Microkernel de tercera generación (familia L4)" },
            { label: "Responsable", value: "seL4 Foundation, asociación suiza sin fines de lucro" },
            { label: "Licencia", value: "GPLv2 (kernel) · BSD-2 (librerías de usuario)" },
            { label: "Versión", value: "seL4 16.0.0 (julio 2026)" },
            { label: "Usado en", value: "DARPA HACMS, autos NIO (SkyOS), TRENTOS de HENSOLDT" },
          ]}
          metrics={[
            { value: "1.3M", label: "Líneas de prueba" },
            { value: "0", label: "Violaciones desde 2009" },
            { value: "256", label: "Prioridades (0 a 255)" },
            { value: "2022", label: "ACM Software System Award" },
          ]}
          sims={[
            { id: "sim-01", label: "SIM 01 · Hackeá el dron" },
            { id: "sim-02", label: "SIM 02 · Presupuesto de CPU" },
          ]}
        />

        <SimSection
          id="sim-01"
          label="// SIM 01: AISLAMIENTO_POR_CAPACIDADES"
          index="01"
          title="Hackeá el dron: un componente comprometido no puede tocar a los demás"
          intro={
            <>
              <p>
                En el programa HACMS de DARPA, un equipo de ataque profesional intentó tomar el control de un helicóptero no
                tripulado que usaba seL4 para separar sus componentes. Tuvieron acceso total a uno de ellos y aun así no
                pudieron afectar el vuelo.
              </p>
              <p>
                La clave son las capacidades: cada componente solo puede usar los objetos (memoria, canales,
                interrupciones) para los que tiene una capacidad, una especie de llave que el kernel verifica en cada
                llamada. Sin la llave, para ese componente el objeto directamente no existe.
              </p>
            </>
          }
          howTo={[
            "En modo seL4, mandá el paquete malicioso: la RADIO queda comprometida.",
            "Probá los cuatro ataques y mirá en la CSpace qué capacidad intentó usar.",
            "Pasá a Monolítico y repetí: el mismo bug alcanza para tomar todo el dron.",
            "Fijate en el comando falso: seL4 lo deja pasar porque el canal está autorizado; lo frena MISIÓN.",
          ]}
          takeaways={[
            {
              label: "Qué demuestra",
              text: "El aislamiento no depende de que los drivers no tengan bugs: depende del kernel, y en seL4 está probado matemáticamente. Un componente comprometido queda encerrado en sus capacidades.",
            },
            {
              label: "En tu SO de todos los días",
              text: "Windows y Linux cargan los drivers dentro del kernel. Por eso un driver con fallas puede tirar abajo todo el sistema o darle a un atacante los privilegios máximos.",
            },
            {
              label: "Límite de la simulación",
              text: "La prueba cubre el kernel, no las aplicaciones: si MISIÓN no validara el comando, el ataque por el canal autorizado funcionaría. Y vale solo para las configuraciones verificadas.",
            },
          ]}
        >
          <DroneSim />
        </SimSection>

        <SimSection
          id="sim-02"
          label="// SIM 02: PRESUPUESTO_DE_CPU_MCS"
          index="02"
          title="La tarea más prioritaria entra en bucle: ¿quién se queda sin CPU?"
          intro={
            <>
              <p>
                Aislar la memoria no alcanza si una tarea puede quedarse con todo el procesador. Con un planificador clásico
                por prioridades, una tarea de prioridad alta que entra en un bucle infinito deja sin CPU a todas las de
                abajo.
              </p>
              <p>
                La extensión MCS (mixed-criticality systems) de seL4 le asigna a cada hilo un scheduling context con
                presupuesto y período: puede usar como máximo X ms cada Y ms. Al agotarlo, el kernel lo frena hasta la
                recarga. Su prueba de corrección funcional se completó en RISC-V en junio de 2026.
              </p>
            </>
          }
          howTo={[
            "Con MCS activado, apretá Reproducir y después Inyectar bucle infinito.",
            "NAVEGACIÓN agota su presupuesto y queda frenada (rayado naranja).",
            "CONTROL y TELEMETRÍA siguen cumpliendo: 0 plazos perdidos.",
            "Pasá a Solo prioridades y repetí: desde el bug, nadie más corre.",
          ]}
          takeaways={[
            {
              label: "Qué demuestra",
              text: "Aislamiento temporal: una tarea con errores no puede robarle el procesador a las demás, aunque tenga más prioridad. Es lo que permite mezclar software crítico y no crítico en el mismo chip.",
            },
            {
              label: "En tu SO de todos los días",
              text: "Un proceso colgado en un bucle puede dejar la PC al 100% de CPU. El planificador de escritorio reparte el tiempo para que todo se sienta fluido, pero no le garantiza plazos a nadie.",
            },
            {
              label: "Límite de la simulación",
              text: "Tres tareas con el mismo período para que se vea. En un sistema real el presupuesto se configura por hilo y el análisis de tiempos del sistema completo sigue siendo trabajo del integrador.",
            },
          ]}
        >
          <McsSim />
        </SimSection>

        <LabNav current="/sel4" />
      </main>
      <Footer />
    </div>
  )
}
