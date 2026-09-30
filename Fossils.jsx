import { FOSSIL_LIMIT } from '../lib/categories'
import { addDays, rp, toISO, weekday } from '../lib/format'

export default function Fossils({ week }) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const spentBy = {}
  for (const x of week) spentBy[x.date] = (spentBy[x.date] || 0) + Number(x.amount)
  const count = days.filter((d) => (spentBy[toISO(d)] || 0) < FOSSIL_LIMIT).length

  return (
    <section className="panel" aria-labelledby="fosH">
      <div className="panel-head">
        <h2 id="fosH">Koleksi Fosil</h2>
        <span className="hint num">{count}/7 hari hemat</span>
      </div>
      <div className="fossils">
        {days.map((d) => {
          const iso = toISO(d)
          const spent = spentBy[iso] || 0
          const on = spent < FOSSIL_LIMIT
          return (
            <div key={iso} className={`fossil ${on ? 'on' : ''}`} title={`${iso}: ${rp(spent)}`}>
              <span>{on ? '🦴' : '·'}</span>
              {weekday(d)}
            </div>
          )
        })}
      </div>
      <p className="hint">Dapat 1 fosil 🦴 tiap hari pengeluaranmu di bawah {rp(FOSSIL_LIMIT)}.</p>
    </section>
  )
}
