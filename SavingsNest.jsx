import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { rp, formatInput, parseAmount } from '../lib/format'
import { useToast } from './Toast'

function Egg({ pct, shake }) {
  const hatched = pct >= 1
  return (
    <div className={`egg ${shake ? 'shake' : ''}`}>
      <svg viewBox="0 0 120 140" aria-hidden="true">
        <ellipse cx="60" cy="126" rx="50" ry="10" fill="var(--nest-soft)" stroke="var(--nest)" strokeWidth="2" />
        <path d="M14 122 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 20 0 q10 -8 12 0" fill="none" stroke="var(--nest)" strokeWidth="3" />
        {!hatched && (
          <g>
            <path d="M60 14 C88 14 102 58 102 84 C102 108 84 122 60 122 C36 122 18 108 18 84 C18 58 32 14 60 14Z" fill="var(--shell)" stroke="var(--dino-dark)" strokeWidth="3" />
            <circle cx="44" cy="60" r="7" fill="var(--dino)" opacity=".6" />
            <circle cx="74" cy="44" r="5" fill="var(--dino)" opacity=".6" />
            <circle cx="78" cy="88" r="8" fill="var(--dino)" opacity=".6" />
            <circle cx="46" cy="98" r="4" fill="var(--dino)" opacity=".6" />
            {pct >= 0.5 && <path d="M34 70 l10 6 l8 -8 l10 8" fill="none" stroke="var(--dino-dark)" strokeWidth="2.5" strokeLinejoin="round" />}
            {pct >= 0.8 && <path d="M62 76 l10 -6 l8 8 l12 -6" fill="none" stroke="var(--dino-dark)" strokeWidth="2.5" strokeLinejoin="round" />}
          </g>
        )}
        {hatched && (
          <g>
            <path d="M18 84 l10 -8 l8 8 l10 -8 l8 8 l10 -8 l8 8 l10 -8 l8 8 l10 -8 l0 22 C102 108 84 122 60 122 C36 122 18 108 18 106Z" fill="var(--shell)" stroke="var(--dino-dark)" strokeWidth="3" />
            <circle cx="60" cy="58" r="26" fill="var(--dino)" stroke="var(--dino-dark)" strokeWidth="3" />
            <circle cx="52" cy="52" r="4" fill="#15233a" />
            <circle cx="70" cy="52" r="4" fill="#15233a" />
            <path d="M52 66 q9 7 18 0" fill="none" stroke="var(--dino-dark)" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  )
}

export default function SavingsNest({ goal, balance, onChanged }) {
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [shake, setShake] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!goal) {
    const create = async () => {
      const { error } = await supabase.from('savings_goals').insert({ name: 'Tabungan Impian' })
      if (error) return toast('Gagal membuat sarang: ' + error.message)
      onChanged()
    }
    return (
      <section className="panel">
        <div className="panel-head"><h2>Sarang Tabungan</h2></div>
        <p className="empty">Belum ada target tabungan.</p>
        <button type="button" className="btn" onClick={create}>Buat Sarang 🥚</button>
      </section>
    )
  }

  const saved = Number(goal.saved)
  const tgt = Number(goal.target)
  const pct = Math.min(1, saved / tgt)
  const msg =
    pct >= 1
      ? 'Telurnya menetas! Target tercapai 🎉'
      : pct >= 0.8
        ? 'Krak-krak! Sebentar lagi menetas…'
        : pct >= 0.5
          ? 'Ada retakan kecil! Sudah lewat setengah jalan.'
          : 'Telurnya masih tidur. Isi terus sarangnya!'

  const adjust = async (sign) => {
    const a = parseAmount(amount)
    if (!a) return toast('Isi jumlahnya dulu ya')
    if (sign > 0 && a > balance) return toast(`Saldo tidak cukup. Saldo sekarang ${rp(balance)}`)
    if (sign < 0 && a > saved) return toast(`Tabungan hanya ${rp(saved)}`)
    setBusy(true)
    const { error } = await supabase.rpc('adjust_savings', { delta: sign * a })
    setBusy(false)
    if (error) return toast('Gagal: ' + error.message)
    setAmount('')
    setShake(true)
    setTimeout(() => setShake(false), 600)
    toast(sign > 0 ? `${rp(a)} masuk sarang 🥚` : `${rp(a)} diambil dari sarang`)
    onChanged()
  }

  const startEdit = () => {
    setName(goal.name)
    setTarget(formatInput(goal.target))
    setEditing(true)
  }

  const saveGoal = async () => {
    const t = parseAmount(target)
    if (!name.trim()) return toast('Beri nama targetnya dulu')
    if (!t) return toast('Target harus lebih dari 0')
    const { error } = await supabase
      .from('savings_goals')
      .update({ name: name.trim(), target: t, updated_at: new Date().toISOString() })
      .eq('user_id', goal.user_id)
    if (error) return toast('Gagal menyimpan: ' + error.message)
    setEditing(false)
    toast('Target tabungan diperbarui')
    onChanged()
  }

  return (
    <section className="panel" aria-labelledby="nestH">
      <div className="panel-head">
        <h2 id="nestH">Sarang Tabungan</h2>
        {!editing && <button type="button" className="btn ghost" onClick={startEdit}>Ubah target</button>}
      </div>

      {editing ? (
        <div className="form one">
          <label>
            Nama target
            <input id="goal-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Target (Rp)
            <input id="goal-target" className="num" inputMode="numeric" value={target} onChange={(e) => setTarget(formatInput(e.target.value))} />
          </label>
          <div className="row">
            <button type="button" className="btn" onClick={saveGoal}>Simpan</button>
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Batal</button>
          </div>
        </div>
      ) : (
        <>
          <div className="nest">
            <Egg pct={pct} shake={shake} />
            <div className="nest-info">
              <div>
                <b>{goal.name}</b>
                <div className="hint num">{rp(saved)} dari {rp(tgt)} · {Math.round(pct * 100)}%</div>
              </div>
              <div className="meter" aria-hidden="true"><i style={{ width: `${pct * 100}%` }} /></div>
              <div className="hint">{msg}</div>
            </div>
          </div>
          <div className="nest-actions">
            <label htmlFor="nest-amount" className="hint full-w">Setor dari saldo atau ambil dari sarang</label>
            <input id="nest-amount" className="num" inputMode="numeric" placeholder="100.000" value={amount} onChange={(e) => setAmount(formatInput(e.target.value))} />
            <button type="button" className="btn" disabled={busy} onClick={() => adjust(1)}>Setor 🥚</button>
            <button type="button" className="btn ghost" disabled={busy} onClick={() => adjust(-1)}>Ambil</button>
          </div>
        </>
      )}
    </section>
  )
}
