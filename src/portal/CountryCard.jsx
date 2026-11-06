import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CountrySelect from './CountrySelect'
import { Alert } from './ui'

// For people who signed up before country was asked for. Renders nothing once
// one is on file, so it disappears for good after a single save, and nothing
// at all if the lookup fails: the likeliest cause is supabase/country.sql not
// having been run, which is not worth a banner on a screen about someone's
// work.
//
// The country lives in profile_private, readable only by the person and by
// admins — see the note at the top of supabase/country.sql.
export default function CountryCard({ userId }) {
  const [state, setState] = useState('loading')
  const [country, setCountry] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase
      .from('profile_private')
      .select('country')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        setState(error || data?.country ? 'hidden' : 'ask')
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (state !== 'ask') return null

  const save = async (e) => {
    e.preventDefault()
    if (!country) return
    setBusy(true)
    setError('')
    const { error } = await supabase.from('profile_private').upsert({ user_id: userId, country })
    setBusy(false)
    if (error) setError(error.message)
    else setState('hidden')
  }

  return (
    <section className="mt-12">
      <form onSubmit={save} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg font-600 text-white">Where are you based?</h2>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
          We ask everyone for a country. Only you and the AIM Now team can see it — it is never shown to businesses or
          other members.
        </p>
        <div className="mt-4 flex max-w-md flex-wrap gap-2">
          <div className="min-w-[14rem] flex-1">
            <CountrySelect value={country} onChange={setCountry} required />
          </div>
          <button type="submit" disabled={busy || !country} className="btn-ghost !px-5 !py-2 !text-xs disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}
      </form>
    </section>
  )
}
