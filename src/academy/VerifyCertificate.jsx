import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Logo from '../components/Logo'
import { isConfigured, supabase } from '../lib/supabase'
import { COURSE_ID, COURSE_SHAPE } from './ids'

// The Academy's equivalent of an issuer's verification page: what an admin
// opens to approve the certificate, and what a business opens from a project
// card to check it. Public for that reason, so it sits outside AcademyApp's
// sign-in wall, and imports ./ids rather than ./content so a business checking
// one link doesn't download the whole course.
//
// Everything it shows comes from academy_verify_certificate() in
// supabase/academy.sql. "Complete" is judged here because the course's shape
// lives in the front end, not in a table.

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Fact({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-200">{children}</p>
    </div>
  )
}

function Result({ record }) {
  // Passed but not paid for, so not issued: said without a name or score.
  if (!record.paid) {
    return (
      <>
        <h1 className="font-display text-xl font-700 text-white">Certificate not yet issued</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          This certificate has not been issued. Check again once AIM Now has confirmed it.
        </p>
      </>
    )
  }

  const complete = record.lessons_done >= COURSE_SHAPE.lessons && record.modules_passed >= COURSE_SHAPE.modules

  if (!complete) {
    return (
      <>
        <h1 className="font-display text-xl font-700 text-white">Not a complete certificate</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          This record passed the final assessment, but not every lesson and module is finished, so no certificate
          stands behind it.
        </p>
      </>
    )
  }

  return (
    <>
      <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
        Verified
      </span>
      <h1 className="mt-4 font-display text-2xl font-700 text-white">{record.full_name || 'AIM Now member'}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Completed Generative AI Fundamentals: {COURSE_SHAPE.modules} modules and {COURSE_SHAPE.lessons} lessons, with
        all module assessments cleared and the final assessment passed.
      </p>
      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-5">
        <Fact label="Awarded">{fmt.format(new Date(record.awarded_at))}</Fact>
        <Fact label="Final assessment">{Math.round((record.score / record.total) * 100)}%</Fact>
        <Fact label="Issued by">AIM Now Academy</Fact>
      </div>
    </>
  )
}

export default function VerifyCertificate() {
  const { id } = useParams()
  // undefined = still checking, null = no such certificate.
  const [record, setRecord] = useState(undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!isConfigured || !UUID.test(id)) {
      setRecord(null)
      return
    }
    let cancelled = false
    supabase.rpc('academy_verify_certificate', { p_course_id: COURSE_ID, p_attempt_id: id }).then(({ data, error }) => {
      if (cancelled) return
      // Kept apart from "not found": telling a business a real certificate
      // doesn't exist because of a network blip would be a false accusation.
      if (error) setFailed(true)
      else setRecord(data?.[0] ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="min-h-screen bg-ink-900 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Logo className="h-7 w-auto" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-cyan-glow">Certificate verification</p>
        <div className="card mt-3">
          {failed ? (
            <p className="text-sm leading-relaxed text-slate-400">
              We couldn't check this certificate just now. Please try again in a moment.
            </p>
          ) : record === undefined ? (
            <p className="text-sm text-slate-400">Checking…</p>
          ) : record === null ? (
            <>
              <h1 className="font-display text-xl font-700 text-white">Certificate not found</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                This link doesn't match a certificate issued by AIM Now Academy.
              </p>
            </>
          ) : (
            <Result record={record} />
          )}
        </div>
      </div>
    </div>
  )
}
