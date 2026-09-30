import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { rp, toISO, addDays, monthStart, addMonths, monthLabel } from '../lib/format'
import { useToast } from './Toast'
import Dino from './Dino'
import TransactionForm from './TransactionForm'
import TransactionList from './TransactionList'
import Budgets from './Budgets'
import SavingsNest from './SavingsNest'
import Fossils from './Fossils'

const QUIPS = [
  'Rrrawr! Sudah catat pengeluaran hari ini?',
  'Tangan Dinorix pendek, tapi jago hemat!',
  'Jajan boleh, asal ingat telur di sarang 🥚',
  'Meteor datang? Tenang, kita punya dana darurat.',
  'Kopi susu hari ini sudah dicatat belum? 👀',
]

export default function Dashboard({ session }) {
  const toast = useToast()
  const [month, setMonth] = useState(() => monthStart(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quip, setQuip] = useState('')
  const [denied, setDenied] = useState(false)
  const [data, setData] = useState({
    totals: { income: 0, expense: 0 },
    tx: [],
    budgets: [],
    goal: null,
    week: [],
    name: '',
  })

  const load = useCallback(async () => {
    const from = toISO(month)
    const to = toISO(addMonths(month, 1))
    const weekFrom = toISO(addDays(new Date(), -6))

    const owner = await supabase.rpc('is_owner')
    if (owner.error) {
      setError(owner.error.message)
      setLoading(false)
      return
    }
    if (owner.data !== true) {
      setDenied(true)
      setLoading(false)
      return
    }

    const res = await Promise.all([
      supabase.rpc('get_totals'),
      supabase
        .from('transactions')
        .select('*')
        .gte('date', from)
        .lt('date', to)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('budgets').select('*'),
      supabase.from('savings_goals').select('*').maybeSingle(),
      supabase.from('transactions').select('date, amount').eq('type', 'expense').gte('date', weekFrom),
      supabase.from('profiles').select('display_name').maybeSingle(),
    ])
    const failed = res.find((r) => r.error)
    if (failed) {
      setError(failed.error.message)
      setLoading(false)
      return
    }
    const [totals, tx, budgets, goal, week, profile] = res.map((r) => r.data)
    const t = (Array.isArray(totals) ? totals[0] : totals) || {}
    setData({
      totals: { income: Number(t.total_income || 0), expense: Number(t.total_expense || 0) },
      tx: tx || [],
      budgets: budgets || [],
      goal,
      week: week || [],
      name: profile?.display_name || session.user.email.split('@')[0],
    })
    setError('')
    setLoading(false)
  }, [month, session.user.email])

  useEffect(() => {
    load()
  }, [load])

  const saved = Number(data.goal?.saved || 0)
  const balance = data.totals.income - data.totals.expense - saved

  const { monthIn, monthOut } = useMemo(() => {
    let i = 0
    let o = 0
    for (const x of data.tx) {
      if (x.type === 'income') i += Number(x.amount)
      else o += Number(x.amount)
    }
    return { monthIn: i, monthOut: o }
  }, [data.tx])

  const isCurrentMonth = toISO(month) === toISO(monthStart(new Date()))

  let mood = 'happy'
  let message
  if (balance < 0) {
    mood = 'bad'
    message = 'AAAA! Saldo minus! Dinorix panik, tahan dulu jajannya ya 😱'
  } else if (monthIn === 0 && monthOut === 0) {
    message = `Halo, ${data.name}! Belum ada catatan di ${monthLabel(month)}. Yuk mulai catat.`
  } else if (monthIn > 0 && monthOut / monthIn > 0.8) {
    mood = 'warn'
    message = `Hmm… pengeluaran sudah ${Math.round((monthOut / monthIn) * 100)}% dari pemasukan. Dinorix mulai berkeringat.`
  } else if (monthIn === 0) {
    mood = 'warn'
    message = `Ada pengeluaran ${rp(monthOut)} tapi belum ada pemasukan bulan ini. Hati-hati ya!`
  } else {
    message = `Rrrawr! ${isCurrentMonth ? 'Bulan ini' : monthLabel(month)} masih sisa ${rp(monthIn - monthOut)}. Dinorix bangga padamu, ${data.name}!`
  }

  const logout = async () => {
    await supabase.auth.signOut()
    toast('Sampai jumpa lagi 👋')
  }

  if (denied) {
    return (
      <div className="center-screen">
        <div className="card narrow">
          <Dino mood="bad" size={110} />
          <h1 className="h-display">Akun ini tidak punya akses</h1>
          <p>
            DinorixLand-Sal hanya bisa dipakai oleh akun utama. Kamu masuk sebagai{' '}
            <b>{session.user.email}</b>.
          </p>
          <button className="btn" type="button" onClick={logout}>Keluar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="auth-brand">
          <span className="logo-mark" aria-hidden="true">🦖</span>
          <span className="brand-name">DinorixLand-Sal</span>
        </div>
        <div className="topbar-right">
          <span className="user-email" title={session.user.email}>{session.user.email}</span>
          <button className="btn ghost" type="button" onClick={logout}>Keluar</button>
        </div>
      </header>

      {error && (
        <div className="banner" role="alert">
          Gagal memuat data: {error}.{' '}
          <button className="link" type="button" onClick={load}>Coba lagi</button>
          <br />
          <small>Pastikan file <code>supabase/schema.sql</code> sudah dijalankan di SQL Editor Supabase.</small>
        </div>
      )}

      <section className="hero">
        <Dino mood={mood} followPointer onClick={() => setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)])} />
        <div className="hero-body">
          <div className={`bubble ${quip ? '' : mood === 'happy' ? '' : mood}`}>{quip || message}</div>
          <div>
            <div className="eyebrow">Saldo di gua (di luar tabungan)</div>
            <div className={`balance num ${loading ? 'loading' : ''}`}>{rp(balance)}</div>
          </div>
          <div className="month-nav">
            <button type="button" className="icon-btn" aria-label="Bulan sebelumnya" onClick={() => { setQuip(''); setMonth((m) => addMonths(m, -1)) }}>‹</button>
            <span className="month-label">{monthLabel(month)}</span>
            <button type="button" className="icon-btn" aria-label="Bulan berikutnya" onClick={() => { setQuip(''); setMonth((m) => addMonths(m, 1)) }}>›</button>
            <span className="flows num">
              <span className="in">▲ Masuk <b>{rp(monthIn)}</b></span>
              <span className="out">▼ Keluar <b>{rp(monthOut)}</b></span>
            </span>
          </div>
        </div>
      </section>

      <div className="board">
        <div className="col">
          <TransactionForm onSaved={load} />
          <TransactionList tx={data.tx} loading={loading} month={month} onChanged={load} />
        </div>
        <div className="col">
          <SavingsNest goal={data.goal} balance={balance} onChanged={load} />
          <Budgets userId={session.user.id} budgets={data.budgets} tx={data.tx} month={month} onChanged={load} />
          <Fossils week={data.week} />
        </div>
      </div>

      <footer className="foot">DinorixLand-Sal · data kamu tersimpan aman di Supabase dan hanya bisa dilihat oleh akunmu.</footer>
    </div>
  )
}
