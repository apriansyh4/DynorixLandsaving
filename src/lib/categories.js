export const EXPENSE_CATS = [
  { key: 'makan', name: 'Makan', emoji: '🍖', defaultLimit: 1500000 },
  { key: 'transport', name: 'Transportasi', emoji: '🛵', defaultLimit: 600000 },
  { key: 'belanja', name: 'Belanja', emoji: '🛍️', defaultLimit: 800000 },
  { key: 'tagihan', name: 'Tagihan', emoji: '🌋', defaultLimit: 1200000 },
  { key: 'hiburan', name: 'Hiburan', emoji: '🎮', defaultLimit: 400000 },
  { key: 'lainnya', name: 'Lainnya', emoji: '🦴', defaultLimit: 0 },
]

export const INCOME_CATS = [
  { key: 'gaji', name: 'Gaji', emoji: '💰' },
  { key: 'sampingan', name: 'Sampingan', emoji: '🥚' },
  { key: 'hadiah', name: 'Hadiah', emoji: '🎁' },
  { key: 'lainnya-masuk', name: 'Lainnya', emoji: '✨' },
]

const ALL = [...EXPENSE_CATS, ...INCOME_CATS]

export const catOf = (key) => ALL.find((c) => c.key === key) || { key, name: key, emoji: '🦴' }

// Batas hari hemat untuk koleksi fosil
export const FOSSIL_LIMIT = 150000
