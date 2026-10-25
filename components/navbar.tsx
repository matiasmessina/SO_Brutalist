"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cpu } from "lucide-react"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/sel4", label: "seL4" },
  { href: "/vxworks", label: "VxWorks" },
  { href: "/inferno", label: "Inferno" },
  { href: "/#comparativa", label: "Comparativa" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full px-4 pt-4 lg:px-6 lg:pt-6"
    >
      <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Cpu size={16} strokeWidth={1.5} />
            <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">SO.LAB</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {LINKS.map((link, i) => {
              const active = pathname === link.href
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "text-xs font-mono tracking-widest uppercase transition-colors duration-200",
                      active ? "text-foreground border-b-2 border-[#ea580c] pb-0.5" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/sel4"
              className="hidden sm:inline-block bg-foreground text-background px-4 py-2 text-xs font-mono tracking-widest uppercase hover:bg-foreground/85 transition-colors"
            >
              Empezar
            </Link>
          </div>
        </div>

        {/* Enlaces en pantallas chicas */}
        <div className="flex md:hidden items-center gap-5 mt-3 pt-3 border-t border-foreground/10 overflow-x-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[10px] font-mono tracking-widest uppercase whitespace-nowrap",
                pathname === link.href ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </motion.div>
  )
}
