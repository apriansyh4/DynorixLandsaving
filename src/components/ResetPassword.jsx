import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import Dino from './Dino'

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return setError('Kata sandi minimal 6 karakter.')
    if (password !== confirm) return setError('Kedua kata sandi belum sama.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    toast('Kata sandi baru tersimpan 🦖')
    onDone()
  }

  return (
    <div className="center-screen">
      <div className="card narrow">
        <Dino mood="happy" size={110} />
        <h1 className="h-display">Buat Kata Sandi Baru</h1>
        <form className="form one" onSubmit={submit} noValidate>
          <label>
            Kata sandi baru
            <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </label>
          <label>
            Ulangi kata sandi
            <input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </label>
          {error && <p className="msg err" role="alert">{error}</p>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan Kata Sandi'}
          </button>
        </form>
      </div>
    </div>
  )
}
