import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { catOf } from '../lib/categories'
import { rp, shortDate, monthLabel } from '../lib/format'
import { useToast } from './Toast'

export default function TransactionList({ tx, loading, month, onChanged }) {
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tx.filter(
      (x) =>
        (filter === 'all' || x.type === filter) &&
        (!q || x.description.toLowerCase().includes(q) || catOf(x.category).name.toLowerCase().includes(q)),
    )
  }, [tx, filter, query])

  const remove = async (x) => {
    const { error } = await supabase.from('transactions').delete().eq('id', x.id)
    setPending(null)
    if (error) return toast('Gagal menghapus: ' + error.message)
    toast(`Dihapus: ${x.description}`)
    onChanged()
  }

  return (
    <section className="panel" aria-labelledby="logH">
      <div className="panel-head">
        <h2 id="logH">Jejak Kaki Uang</h2>
        <div className="filters" role="group" aria-label="Saring transaksi">
          {[
            ['all', 'Semua'],
            ['expense', 'Keluar'],
            ['income', 'Masuk'],
          ].map(([k, l]) => (
            <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <input id="tx-search" className="search" type="search" placeholder="Cari transaksi…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Cari transaksi" />
      <ul className="list">
        {loading && <li className="empty">Menggali data…</li>}
        {!loading && rows.length === 0 && (
          <li className="empty">
            {tx.length === 0
              ? `Belum ada jejak di ${monthLabel(month)}. Catat transaksi pertamamu di atas 🦖`
              : 'Tidak ada transaksi yang cocok.'}
          </li>
        )}
        {!loading &&
          rows.map((x) => {
            const c = catOf(x.category)
            const t = x.type === 'expense' ? 'o' : 'i'
            return (
              <li key={x.id} className={`tx ${t}`}>
                <div className="ic" aria-hidden="true">{c.emoji}</div>
                <div className="t">
                  <b>{x.description}</b>
                  <small>{c.name} · {shortDate(x.date)}</small>
                </div>
                <div className="amt num">{t === 'o' ? '−' : '+'}{rp(x.amount)}</div>
                {pending === x.id ? (
                  <span className="confirm">
                    <button type="button" className="mini danger" onClick={() => remove(x)}>Hapus</button>
                    <button type="button" className="mini" onClick={() => setPending(null)}>Batal</button>
                  </span>
                ) : (
                  <button type="button" className="del" aria-label={`Hapus ${x.description}`} onClick={() => setPending(x.id)}>×</button>
                )}
              </li>
            )
          })}
      </ul>
    </section>
  )
}
