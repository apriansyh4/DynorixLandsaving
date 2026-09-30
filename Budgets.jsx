import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EXPENSE_CATS } from '../lib/categories'
import { rp, formatInput, parseAmount, monthLabel } from '../lib/format'
import { useToast } from './Toast'

export default function Budgets({ userId, budgets, tx, month, onChanged }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [busy, setBusy] = useState(false)

  const limits = useMemo(() => Object.fromEntries(budgets.map((b) => [b.category, Number(b.monthly_limit)])), [budgets])

  const used = useMemo(() => {
    const u = {}
    for (const x of tx) if (x.type === 'expense') u[x.category] = (u[x.category] || 0) + Number(x.amount)
    return u
  }, [tx])

  const startEdit = () => {
    setDraft(Object.fromEntries(EXPENSE_CATS.map((c) => [c.key, formatInput(limits[c.key] ?? c.defaultLimit)])))
    setEditing(true)
  }

  const saveAll = async () => {
    setBusy(true)
    const rows = EXPENSE_CATS.map((c) => ({ user_id: userId, category: c.key, monthly_limit: parseAmount(draft[c.key]) }))
    const { error } = await supabase.from('budgets').upsert(rows, { onConflict: 'user_id,category' })
    setBusy(false)
    if (error) return toast('Gagal menyimpan jatah: ' + error.message)
    setEditing(false)
    toast('Jatah bulanan diperbarui 🍖')
    onChanged()
  }

  const shown = EXPENSE_CATS.filter((c) => (limits[c.key] ?? 0) > 0 || used[c.key])

  return (
    <section className="panel" aria-labelledby="budH">
      <div className="panel-head">
        <h2 id="budH">Jatah Makan Dino</h2>
        {!editing ? (
          <button type="button" className="btn ghost" onClick={startEdit}>Atur jatah</button>
        ) : (
          <span className="hint">Isi 0 untuk menyembunyikan</span>
        )}
      </div>

      {editing ? (
        <div className="budget-edit">
          {EXPENSE_CATS.map((c) => (
            <label key={c.key} className="budget-row">
              <span>{c.emoji} {c.name}</span>
              <input
                id={`budget-${c.key}`}
                className="num"
                inputMode="numeric"
                value={draft[c.key] ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, [c.key]: formatInput(e.target.value) }))}
                placeholder="0"
              />
            </label>
          ))}
          <div className="row">
            <button type="button" className="btn" disabled={busy} onClick={saveAll}>{busy ? 'Menyimpan…' : 'Simpan Jatah'}</button>
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Batal</button>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <p className="empty">Belum ada jatah bulanan. Tekan “Atur jatah” untuk membuatnya.</p>
      ) : (
        <div className="budgets">
          <p className="hint">Pemakaian {monthLabel(month)}</p>
          {shown.map((c) => {
            const limit = limits[c.key] ?? 0
            const u = used[c.key] || 0
            const p = limit ? u / limit : u > 0 ? 1 : 0
            const st = p >= 1 ? ['bad', 'Kenyang!'] : p >= 0.75 ? ['warn', 'Hampir'] : ['ok', 'Aman']
            return (
              <div className="bud" key={c.key}>
                <div className="bud-top">
                  <span>
                    {c.emoji} {c.name}
                    <span className={`pill ${st[0]}`}>{st[1]}</span>
                  </span>
                  <small className="num">
                    {rp(u)} / {limit ? rp(limit) : 'tanpa batas'}
                  </small>
                </div>
                <div className="bar" aria-hidden="true">
                  <i className={st[0]} style={{ width: `${Math.min(100, p * 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
