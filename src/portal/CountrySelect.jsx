import { COUNTRIES } from './countries'

// Starts blank rather than guessing from the browser's locale: a wrong guess
// that is accepted without a look is worse than an empty field, and someone on
// a work laptop abroad would be recorded in the wrong country without ever
// being asked.
export default function CountrySelect({ value, onChange, required }) {
  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="input">
      {/* bg-ink-800 on every option, as on the sign-up dropdown in SignIn: the
          list is drawn by the browser, and without a background of its own it
          inherits this field's light text and shows white on white. */}
      <option value="" className="bg-ink-800">
        Choose your country…
      </option>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code} className="bg-ink-800">
          {c.name}
        </option>
      ))}
    </select>
  )
}
