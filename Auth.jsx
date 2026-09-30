import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Dino from './Dino'

const translate = (msg = '') => {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email atau kata sandi salah.'
  if (m.includes('email not confirmed'))
    return 'Email akun ini belum dikonfirmasi. Konfirmasi di Supabase: Authentication → Users.'
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  if (m.includes('valid email') || m.includes('invalid format')) return 'Format email belum benar.'
  return msg || 'Terjadi kesalahan. Coba lagi.'
}

export default function Auth() {
  const [mode, setMode] = useState('login') // login | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email.trim()) return setError('Isi email akun utama.')
    if (mode === 'login' && !password) return setError('Isi kata sandi.')
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setInfo('Kalau email ini terdaftar, tautan atur ulang kata sandi sudah dikirim.')
      }
    } catch (err) {
      setError(translate(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="auth-brand">
          <span className="logo-mark" aria-hidden="true">🦖</span>
          <span className="brand-name">DinorixLand-Sal</span>
        </div>
        <Dino mood="happy" size={220} followPointer />
        <h1 className="h-display auth-title">Catat uangmu, jaga telur tabunganmu.</h1>
        <p className="auth-lead">
          Dinorix si dino biru membantu kamu mencatat pemasukan dan pengeluaran, menjaga jatah
          bulanan, dan menetaskan target tabungan.
        </p>
      </section>

      <section className="card auth-card" aria-labelledby="authH">
        <h2 id="authH" className="h-display">
          {mode === 'login' ? 'Masuk ke Gua' : 'Lupa Kata Sandi'}
        </h2>
        <p className="hint">
          {mode === 'login'
            ? 'Khusus akun utama pemilik DinorixLand-Sal.'
            : 'Masukkan email akun utama. Tautan untuk membuat kata sandi baru akan dikirim ke sana.'}
        </p>

        <form className="form one" onSubmit={submit} noValidate>
          <label>
            Email
            <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" autoComplete="email" />
          </label>
          {mode === 'login' && (
            <label>
              Kata sandi
              <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
          )}

          {error && <p className="msg err" role="alert">{error}</p>}
          {info && <p className="msg ok" role="status">{info}</p>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Tunggu sebentar…' : mode === 'login' ? 'Masuk' : 'Kirim Tautan'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' ? (
            <button type="button" className="link" onClick={() => switchMode('forgot')}>Lupa kata sandi?</button>
          ) : (
            <button type="button" className="link" onClick={() => switchMode('login')}>← Kembali ke halaman masuk</button>
          )}
        </div>
      </section>
    </div>
  )
}
