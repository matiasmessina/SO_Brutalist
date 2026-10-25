import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { LabsSection } from "@/components/labs-section"
import { AboutSection } from "@/components/about-section"
import { ComparisonSection } from "@/components/comparison-section"
import { GlitchMarquee } from "@/components/glitch-marquee"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <Navbar />
      <main>
        <HeroSection />
        <LabsSection />
        <AboutSection />
        <ComparisonSection />
        <GlitchMarquee />
      </main>
      <Footer />
    </div>
  )
}
