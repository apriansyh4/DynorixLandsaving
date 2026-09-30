import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Dino from './Dino'

const translate = (msg = '') => {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email atau kata sandi salah.'
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk (atau folder spam) kamu.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Email ini sudah terdaftar. Silakan masuk.'
  if (m.includes('password should be')) return 'Kata sandi minimal 6 karakter.'
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  if (m.includes('valid email') || m.includes('invalid format')) return 'Format email belum benar.'
  return msg || 'Terjadi kesalahan. Coba lagi.'
}

export default function Auth() {
  const [mode, setMode] = useState('login') // login | register | forgot
  const [name, setName] = useState('')
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
    if (!email.trim()) return setError('Isi email kamu.')
    if (mode !== 'forgot' && password.length < 6) return setError('Kata sandi minimal 6 karakter.')
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        if (!data.session) {
          setInfo('Akun dibuat! Cek email kamu dan klik tautan konfirmasi, lalu masuk.')
          setMode('login')
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setInfo('Tautan atur ulang kata sandi sudah dikirim ke email kamu.')
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
          {mode === 'login' ? 'Masuk ke Gua' : mode === 'register' ? 'Daftar Akun Baru' : 'Lupa Kata Sandi'}
        </h2>

        {mode !== 'forgot' && (
          <div className="seg" role="group" aria-label="Pilih masuk atau daftar">
            <button type="button" aria-pressed={mode === 'login'} onClick={() => switchMode('login')}>
              Masuk
            </button>
            <button type="button" aria-pressed={mode === 'register'} onClick={() => switchMode('register')}>
              Daftar
            </button>
          </div>
        )}

        <form className="form one" onSubmit={submit} noValidate>
          {mode === 'register' && (
            <label>
              Nama panggilan
              <input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Salsa" maxLength={40} autoComplete="nickname" />
            </label>
          )}
          <label>
            Email
            <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" autoComplete="email" />
          </label>
          {mode !== 'forgot' && (
            <label>
              Kata sandi
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
          )}

          {error && <p className="msg err" role="alert">{error}</p>}
          {info && <p className="msg ok" role="status">{info}</p>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Tunggu sebentar…' : mode === 'login' ? 'Masuk' : mode === 'register' ? 'Buat Akun' : 'Kirim Tautan'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <button type="button" className="link" onClick={() => switchMode('forgot')}>
              Lupa kata sandi?
            </button>
          )}
          {mode === 'forgot' && (
            <button type="button" className="link" onClick={() => switchMode('login')}>
              ← Kembali ke halaman masuk
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
