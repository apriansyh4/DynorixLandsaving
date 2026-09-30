import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { EXPENSE_CATS, INCOME_CATS } from '../lib/categories'
import { formatInput, parseAmount, rp, toISO } from '../lib/format'
import { useToast } from './Toast'

export default function TransactionForm({ onSaved }) {
  const toast = useToast()
  const [type, setType] = useState('expense')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATS[0].key)
  const [date, setDate] = useState(() => toISO(new Date()))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS

  const changeType = (t) => {
    setType(t)
    setCategory((t === 'expense' ? EXPENSE_CATS : INCOME_CATS)[0].key)
  }

  const submit = async (e) => {
    e.preventDefault()
    const a = parseAmount(amount)
    if (!desc.trim()) return setError('Tulis keterangannya dulu, misalnya “Makan siang”.')
    if (!a) return setError('Isi jumlahnya dalam rupiah, lebih dari 0.')
    if (!date) return setError('Pilih tanggal transaksinya.')
    setError('')
    setBusy(true)
    const { error } = await supabase
      .from('transactions')
      .insert({ type, category, description: desc.trim(), amount: a, date })
    setBusy(false)
    if (error) return setError('Gagal menyimpan: ' + error.message)
    setDesc('')
    setAmount('')
    toast(type === 'expense' ? `Tercatat: ${rp(a)} keluar 🍖` : `Asyik! ${rp(a)} masuk 🥚`)
    onSaved()
  }

  return (
    <section className="panel" aria-labelledby="addH">
      <div className="panel-head">
        <h2 id="addH">Catat Transaksi</h2>
        <span className="hint">Dinorix mencatatnya di batu</span>
      </div>
      <div className="seg typed" role="group" aria-label="Jenis transaksi">
        <button type="button" className="o" aria-pressed={type === 'expense'} onClick={() => changeType('expense')}>
          🍖 Pengeluaran
        </button>
        <button type="button" className="i" aria-pressed={type === 'income'} onClick={() => changeType('income')}>
          🥚 Pemasukan
        </button>
      </div>
      <form className="form" onSubmit={submit} noValidate>
        <label className="full">
          Keterangan
          <input
            id="tx-desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={80}
            placeholder={type === 'expense' ? 'mis. Makan siang di warteg' : 'mis. Bonus proyek'}
          />
        </label>
        <label>
          Jumlah (Rp)
          <input id="tx-amount" className="num" inputMode="numeric" value={amount} onChange={(e) => setAmount(formatInput(e.target.value))} placeholder="25.000" />
        </label>
        <label>
          Kategori
          <select id="tx-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {cats.map((c) => (
              <option key={c.key} value={c.key}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          Tanggal
          <input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="full row">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan ke Batu 🪨'}
          </button>
          {error && <span className="msg err" role="alert">{error}</span>}
        </div>
      </form>
    </section>
  )
}
