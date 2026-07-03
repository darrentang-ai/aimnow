import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Portal from './components/Portal'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="relative min-h-screen bg-ink-900">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Portal />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
