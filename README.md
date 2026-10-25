# SO.LAB · seL4, VxWorks e Inferno en simulaciones

Sitio que acompaña la exposición del Trabajo Práctico Especial de Sistemas Operativos (evaluación de producto). Cada laboratorio simula en el navegador las funcionalidades que distinguen a cada sistema frente a un sistema operativo convencional.

Basado en el template "Brutalist AI SaaS Landing Page" de v0 (Next.js 16, Tailwind CSS y Framer Motion).

## Cómo correrlo

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Para la versión de producción: `pnpm build` y después `pnpm start`.

## Páginas y simulaciones

| Ruta | Simulación | Qué muestra |
| --- | --- | --- |
| `/sel4` | SIM 01 · Hackeá el dron | Aislamiento por capacidades frente a un kernel monolítico |
| `/sel4` | SIM 02 · Presupuesto de CPU | Scheduling contexts de MCS frente a prioridades fijas |
| `/vxworks` | SIM 03 · Mars Pathfinder | Inversión de prioridades y herencia de prioridad |
| `/vxworks` | SIM 04 · Corte de luz | dosFs (FAT) frente a HRFS transaccional |
| `/inferno` | SIM 05 + 06 · Shell y visor 9P | Namespaces por proceso, bind/mount y mensajes Styx |
| `/` | Portada | Laboratorios, comparativa y casos reales |

## Dónde está cada cosa

- `lib/sims/`: los modelos de cada simulación (TypeScript puro, sin interfaz). Son deterministas y se pueden probar por separado.
- `components/sims/`: la interfaz de cada simulador.
- `components/sim/`: piezas compartidas (ventana, controles, diagrama de tiempo).
- `components/os/`: encabezado, sección y navegación de las páginas de cada sistema.

Las simulaciones son modelos didácticos simplificados: muestran el comportamiento de cada sistema, no lo emulan.
