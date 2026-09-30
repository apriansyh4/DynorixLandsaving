import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import { ToastProvider } from './components/Toast'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import ResetPassword from './components/ResetPassword'
import Dino from './components/Dino'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  let screen
  if (!isConfigured) screen = <NotConfigured />
  else if (loading) screen = <Loading />
  else if (recovery && session) screen = <ResetPassword onDone={() => setRecovery(false)} />
  else if (!session) screen = <Auth />
  else screen = <Dashboard session={session} />

  return <ToastProvider>{screen}</ToastProvider>
}

function Loading() {
  return (
    <div className="center-screen">
      <Dino mood="happy" size={120} />
      <p className="muted">Dinorix sedang membuka gua…</p>
    </div>
  )
}

function NotConfigured() {
  return (
    <div className="center-screen">
      <div className="card narrow">
        <Dino mood="warn" size={110} />
        <h1 className="h-display">Supabase belum tersambung</h1>
        <p>
          Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di file{' '}
          <code>.env.local</code> (lokal) atau di Environment Variables Vercel, lalu jalankan ulang
          / deploy ulang.
        </p>
        <p className="muted">Panduan lengkap ada di README.md.</p>
      </div>
    </div>
  )
}
