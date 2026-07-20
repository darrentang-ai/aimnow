import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Portal from './components/Portal'
import About from './components/About'
import Projects from './components/Projects'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  // Deep-link support: on a cold load with a hash (e.g. /#projects), the
  // target element doesn't exist until React has mounted, so the browser's
  // native anchor jump is a no-op. Scroll to it once rendered.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    const jump = () => {
      const el = document.getElementById(id)
      if (!el) return
      // Instant jump for deep-links (override the global smooth-scroll).
      const root = document.documentElement
      const prev = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      el.scrollIntoView({ block: 'start' })
      root.style.scrollBehavior = prev
    }
    jump()
    // Re-align after layout settles (fonts/images) — setTimeout fires even
    // in background tabs, unlike requestAnimationFrame.
    const t = setTimeout(jump, 250)
    window.addEventListener('load', jump, { once: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('load', jump)
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-ink-900">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Portal />
        <About />
        <Projects />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
