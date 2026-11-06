import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import CertificatePreview from './CertificatePreview'
import { FINAL_ID, course, totalLessons } from './content'
import { CERTIFICATE_PRICE } from './ids'
import { bestAttempt, courseState, requestPaymentLink } from './progress'

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Certificate({ state, name, email }) {
  const cs = courseState(state)
  // Seeded from the record, then set locally on a successful request so the
  // button flips without a reload.
  const [requestedAt, setRequestedAt] = useState(state.paymentRequestedAt ?? null)
  const [requesting, setRequesting] = useState(false)
  const [requestError, setRequestError] = useState('')

  const request = async () => {
    setRequesting(true)
    setRequestError('')
    const { requestedAt: when, error } = await requestPaymentLink()
    setRequesting(false)
    if (error) setRequestError(error.message)
    else setRequestedAt(when)
  }

  if (!cs.certified) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-700 text-white">Certificate</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Issued once the whole course is finished: every lesson marked complete, every module quiz cleared, and the
          final assessment passed. You are at {cs.lessonsDone} of {cs.lessonsTotal} lessons and{' '}
          {cs.modulesComplete} of {cs.modulesTotal} modules.
        </p>
        <Link to="/academy" className="btn-ghost mt-6">
          Back to the course
        </Link>
      </div>
    )
  }

  // Passed, but not yet paid for. The course and the assessment are free; the
  // certificate is what is charged for, and an admin records the payment.
  if (!state.certificatePaid) {
    return (
      <div className="flex max-w-3xl flex-wrap items-center justify-between gap-10">
        <div className="min-w-0 max-w-md">
          <h1 className="font-display text-2xl font-700 text-white">Course complete</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            You have passed the final assessment. The course and assessment are free; the verified certificate is{' '}
            <span className="font-semibold text-white">{CERTIFICATE_PRICE}</span>. Issued within 24 hours of payment.
          </p>
          {/* A fixed request, not a message box: the function builds the text
              from the account, so there is nothing to type, and it can only be
              sent once. See academy_request_payment in supabase/academy.sql. */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={request}
              disabled={requesting || Boolean(requestedAt)}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {requestedAt
                ? `Requested on ${fmt.format(new Date(requestedAt))}`
                : requesting
                  ? 'Requesting…'
                  : 'Request payment link'}
            </button>
            <Link to="/academy" className="btn-ghost">
              Back to the course
            </Link>
          </div>
          {requestedAt && (
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              We have your request and will send the link to your messages in the portal. The certificate appears
              here once payment is recorded.
            </p>
          )}
          {requestError && <p className="mt-3 text-sm text-red-300">{requestError}</p>}
        </div>
        <CertificatePreview />
      </div>
    )
  }

  const final = bestAttempt(state.attempts, FINAL_ID)
  const awarded = fmt.format(new Date(final.created_at))
  // The record is the attempt rows in Supabase; this is the readable face of
  // them. The attempt id doubles as the reference so a certificate someone
  // prints can be traced back to the exact sitting it came from.
  const reference = final.id.slice(0, 8).toUpperCase()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="font-display text-xl font-700 text-white">Your certificate</h1>
        <button onClick={() => window.print()} className="btn-ghost !py-2.5 !text-xs">
          Print or save as PDF
        </button>
      </div>

      {/* print:* so the page prints as the certificate alone — the shell, the
          contents list and the buttons are all dropped. See the print rules in
          src/index.css. */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-cyan-glow/25 bg-gradient-to-b from-aim-blue/10 to-transparent p-8 text-center sm:p-14 print:border-slate-300 print:bg-white">
        <Logo className="mx-auto h-8 w-auto" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow print:text-slate-600">
          Certificate of completion
        </p>
        <p className="mt-8 text-sm text-slate-400 print:text-slate-600">This certifies that</p>
        <p className="mt-2 font-display text-2xl font-700 text-white sm:text-3xl print:text-slate-900">
          {name || email}
        </p>
        <p className="mt-6 text-sm text-slate-400 print:text-slate-600">has completed</p>
        <p className="mt-2 font-display text-xl font-700 text-white print:text-slate-900">{course.title}</p>
        <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-slate-400 print:text-slate-600">
          {course.modules.length} modules and {totalLessons} lessons, with all module assessments cleared and the final
          assessment passed at {Math.round((final.score / final.total) * 100)}%.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-white/10 pt-6 text-left print:border-slate-200">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Awarded</p>
            <p className="mt-0.5 text-sm text-slate-200 print:text-slate-900">{awarded}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reference</p>
            <p className="mt-0.5 font-mono text-sm text-slate-200 print:text-slate-900">{reference}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Issued by</p>
            <p className="mt-0.5 text-sm text-slate-200 print:text-slate-900">AIM Now Academy</p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-slate-500 print:hidden">
        {name
          ? 'The name shown is the one on your portal profile.'
          : 'No name is set on your portal profile, so your email is shown instead — add your name in the portal and reload to change it.'}
      </p>

      <Link to="/academy" className="btn-ghost mt-6 print:hidden">
        Back to the course
      </Link>
    </div>
  )
}
