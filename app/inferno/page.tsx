import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { OsHero } from "@/components/os/os-hero"
import { SimSection } from "@/components/os/sim-section"
import { LabNav } from "@/components/os/lab-nav"
import { InfernoLab } from "@/components/sims/inferno-lab"

export const metadata: Metadata = {
  title: "Inferno",
  description: "Simulaciones de Inferno: una shell con namespaces por proceso y un visor de los mensajes Styx (9P) que viajan al montar otra máquina.",
}

export default function InfernoPage() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Navbar />
      <main>
        <OsHero
          code="LAB_03: INFERNO"
          index="03"
          pixelTitle="INFERNO"
          tagline="SO distribuido · Bell Labs, 1996 · hoy open source (MIT)"
          description="Inferno salió de Bell Labs, el laboratorio que creó Unix y C, como sucesor de Plan 9. Lleva tres ideas al extremo: todo recurso es un archivo, cada proceso arma su propia vista del sistema (su namespace) y un único protocolo, Styx (9P), sirve para acceder a cualquier cosa, local o remota. Los programas se escriben en Limbo y corren sobre la máquina virtual Dis, igual en cualquier procesador."
          facts={[
            { label: "Tipo", value: "SO distribuido sobre la VM Dis · nativo o alojado en otro SO" },
            { label: "Responsable", value: "Comunidad · mantenido por Charles Forsyth (Terzarima Systems)" },
            { label: "Licencia", value: "MIT desde 2021" },
            { label: "Versión", value: "4th Edition, rama de abril 2026 · fork Inferno64" },
            { label: "Origen", value: "Bell Labs: Pike, Dorward, Winterbottom, Ritchie, Thompson y otros" },
          ]}
          metrics={[
            { value: "1997", label: "Release 1.0" },
            { value: "1 MiB", label: "RAM mínima, sin MMU" },
            { value: "1", label: "Protocolo para todo (Styx)" },
            { value: "6666", label: "Puerto TCP de Styx" },
          ]}
          sims={[{ id: "sim-05", label: "SIM 05 + 06 · Shell y visor 9P" }]}
        />

        <SimSection
          id="sim-05"
          label="// SIM 05 + 06: NAMESPACES_Y_STYX"
          index="05"
          title="Montá otra máquina como si fuera una carpeta"
          intro={
            <>
              <p>
                En Windows, usar la cámara o un sensor de otra computadora requiere un programa, un protocolo y una
                configuración específicos. En Inferno no: la otra máquina se monta en tu namespace y sus dispositivos
                aparecen como archivos. cat lee, echo escribe, y el sistema traduce cada operación a mensajes Styx.
              </p>
              <p>
                A la izquierda, una shell con dos procesos que comparten la misma máquina pero no ven lo mismo: el namespace
                es por proceso, así que también es la herramienta de aislamiento. A la derecha, el visor muestra cada mensaje
                9P que viaja por la red.
              </p>
            </>
          }
          howTo={[
            "Seguí el recorrido guiado de abajo, en orden, o escribí tus propios comandos (help).",
            "En los pasos 4 a 8 mirá el visor: cada cat o echo remoto se vuelve Twalk, Topen, Tread o Twrite y Tclunk.",
            "En el paso 6, el texto aparece en la consola de servidor-lab.",
            "Los pasos 9 y 10 cambian al sandbox: mismo sistema, pero sin /net no hay red.",
          ]}
          takeaways={[
            {
              label: "Qué demuestra",
              text: "Un único mecanismo (archivos y 9P) reemplaza docenas de APIs y protocolos. Y como cada proceso tiene su namespace, darle o quitarle recursos a un programa es tan simple como montar o no montar un directorio.",
            },
            {
              label: "En tu SO de todos los días",
              text: "Linux tiene /dev y /proc, pero la red, las ventanas y los dispositivos remotos usan APIs distintas. Las carpetas compartidas de Windows comparten archivos, no dispositivos. Los namespaces de Linux, base de Docker, retoman una idea que popularizaron Plan 9 e Inferno.",
            },
            {
              label: "Límite de la simulación",
              text: "El intérprete imita la shell de Inferno sobre un sistema de archivos ficticio. Los mensajes respetan el formato de 9P2000, pero no hay red real y la autenticación con certificados se muestra resumida.",
            },
          ]}
        >
          <InfernoLab />
        </SimSection>

        <LabNav current="/inferno" />
      </main>
      <Footer />
    </div>
  )
}
