// Format & tanggal. Semua tanggal memakai waktu lokal (bukan UTC),
// supaya transaksi jam 01.00 WIB tidak tercatat di hari sebelumnya.

export const rp = (n) =>
  (n < 0 ? '-' : '') + 'Rp' + Math.abs(Math.round(Number(n) || 0)).toLocaleString('id-ID')

export const parseAmount = (s) => Number(String(s ?? '').replace(/[^\d]/g, '')) || 0

export const formatInput = (s) => {
  const n = parseAmount(s)
  return n ? n.toLocaleString('id-ID') : ''
}

const pad = (n) => String(n).padStart(2, '0')

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1)

export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1)

export const monthLabel = (d) => d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

export const shortDate = (iso) =>
  fromISO(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

export const weekday = (d) => d.toLocaleDateString('id-ID', { weekday: 'short' })
