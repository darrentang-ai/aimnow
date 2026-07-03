// Captures the PWA install event so it can be triggered on demand (from a
// button tap) instead of showing an automatic banner. The browser only
// allows prompt() inside a user gesture, so we stash the deferred event
// and replay it when the user taps a CTA.

let deferredPrompt = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar; we drive the prompt ourselves.
    e.preventDefault()
    deferredPrompt = e
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
  })
}

// Whether a native install prompt is currently available.
export function canInstall() {
  return !!deferredPrompt
}

// Show the native install prompt if available. Returns true if it was
// shown, false otherwise (already installed, unsupported browser, etc.).
// Must be called synchronously from within a user gesture.
export async function promptInstall() {
  if (!deferredPrompt) return false
  deferredPrompt.prompt()
  await deferredPrompt.userChoice
  deferredPrompt = null
  return true
}
