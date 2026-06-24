import { useEffect, useState } from 'react'

// Captures the beforeinstallprompt event and offers a custom A2HS banner.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      if (!sessionStorage.getItem('aimnow-install-dismissed')) setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  const dismiss = () => {
    sessionStorage.setItem('aimnow-install-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-cyan-glow/30 bg-ink-800/95 p-3 shadow-glow backdrop-blur-xl">
        <img src="/favicon.svg" alt="AIM NOW" className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-600 text-white">Install AIM NOW</p>
          <p className="truncate text-xs text-slate-400">Add to your home screen for instant access.</p>
        </div>
        <button onClick={install} className="btn-primary !px-4 !py-2 !text-xs">Install</button>
        <button onClick={dismiss} aria-label="Dismiss" className="text-slate-500 transition-colors hover:text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
