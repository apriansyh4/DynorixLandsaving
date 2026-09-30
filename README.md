# 🦖 DinorixLand-Sal

Aplikasi kelola keuangan pribadi bertema dinosaurus biru. Dinorix si maskot menemani kamu mencatat
uang, menjaga jatah bulanan, dan menetaskan telur tabungan.

**Teknologi:** React + Vite (frontend) · Supabase (login & database) · Vercel (hosting)

## Fitur

- **Login & daftar** dengan email + kata sandi, termasuk lupa kata sandi (reset lewat email)
- **Catat transaksi** pemasukan / pengeluaran per kategori, format Rupiah otomatis
- **Riwayat per bulan** dengan navigasi bulan, filter, pencarian, dan hapus (dengan konfirmasi)
- **Saldo di gua** = total pemasukan − total pengeluaran − isi tabungan
- **Dinorix berubah ekspresi**: senang, berkeringat (pengeluaran > 80% pemasukan), atau panik (saldo minus)
- **Sarang Tabungan**: setor / ambil, ubah nama & target; telur retak di 50% & 80%, menetas di 100%
- **Jatah Makan Dino**: batas bulanan per kategori (bisa diatur) dengan status Aman / Hampir / Kenyang
- **Koleksi Fosil**: 1 fosil untuk tiap hari hemat (pengeluaran < Rp150.000) dalam 7 hari terakhir
- **Mode gelap** otomatis mengikuti pengaturan perangkat, tampilan rapi di ponsel
- **Aman**: Row Level Security Supabase memastikan setiap akun hanya bisa melihat datanya sendiri

## Struktur

```
DinorixLand-Sal/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json            # konfigurasi deploy Vercel
├── .env.example           # contoh variabel lingkungan
├── public/favicon.svg
├── supabase/schema.sql    # tabel, keamanan (RLS), fungsi & trigger
└── src/
    ├── App.jsx            # alur login / dashboard
    ├── main.jsx
    ├── styles.css         # tema biru
    ├── lib/               # koneksi Supabase, format Rupiah & tanggal, kategori
    └── components/        # Auth, Dashboard, Dino, Transaksi, Budget, Tabungan, Fosil
```

---

## Langkah 1 — Siapkan Supabase

1. Buka <https://supabase.com>, buat akun, lalu **New project**. Catat kata sandi database-nya.
2. Setelah project siap, buka **SQL Editor → New query**.
3. Salin seluruh isi `supabase/schema.sql`, tempel, lalu klik **Run**. Harus muncul *Success*.
4. Buka **Project Settings → API** (di versi baru: **Data API** dan **API Keys**) dan catat:
   - **Project URL** → untuk `VITE_SUPABASE_URL`
   - **anon public key** (atau **publishable key**) → untuk `VITE_SUPABASE_ANON_KEY`

   ⚠️ Jangan pernah memakai `service_role` / secret key di aplikasi ini.

5. (Opsional untuk uji coba) **Authentication → Sign In / Providers → Email**: matikan
   *Confirm email* supaya bisa langsung masuk setelah daftar. Untuk produksi sebaiknya tetap aktif.

## Langkah 2 — Jalankan di komputer (opsional)

Butuh Node.js 18 atau lebih baru.

```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
# isi .env.local dengan URL & key dari Langkah 1
npm run dev
```

Buka alamat yang muncul (biasanya <http://localhost:5173>).

## Langkah 3 — Deploy ke Vercel

**Cara A — lewat GitHub (disarankan)**

1. Upload folder ini ke repository GitHub baru.
2. Buka <https://vercel.com/new>, pilih repository tersebut. Framework otomatis terdeteksi **Vite**.
3. Buka bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon / publishable key
4. Klik **Deploy**. Selesai! Kamu akan mendapat alamat seperti `https://dinorixland-sal.vercel.app`.

**Cara B — lewat Vercel CLI**

```bash
npm i -g vercel
vercel                      # ikuti pertanyaannya
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

> Variabel `VITE_…` dimasukkan saat build. Kalau kamu menambah atau mengubahnya setelah deploy,
> lakukan **Redeploy** di Vercel.

## Langkah 4 — Sambungkan alamat Vercel ke Supabase

Supaya tautan konfirmasi email dan reset kata sandi mengarah ke situsmu:

1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://nama-proyekmu.vercel.app`
3. **Redirect URLs**: tambahkan `https://nama-proyekmu.vercel.app/**` dan `http://localhost:5173/**`

---

## Mengubah pengaturan

- **Kategori** pemasukan & pengeluaran: `src/lib/categories.js`
- **Batas hari hemat** (fosil): `FOSSIL_LIMIT` di file yang sama
- **Jatah awal** untuk pengguna baru: bagian `handle_new_user` di `supabase/schema.sql`
- **Warna tema**: variabel di bagian atas `src/styles.css`

## Masalah umum

| Gejala | Solusi |
| --- | --- |
| Muncul layar "Supabase belum tersambung" | Environment variable belum diisi, atau belum redeploy setelah mengisinya |
| "Gagal memuat data … function get_totals does not exist" | `schema.sql` belum dijalankan di SQL Editor |
| Setelah daftar tidak bisa masuk | Klik tautan konfirmasi di email, atau matikan *Confirm email* (Langkah 1.5) |
| Tautan email membuka localhost | Atur **Site URL** di Langkah 4 |
| Akun lama tidak punya jatah / sarang | Tekan "Atur jatah" lalu simpan, dan "Buat Sarang" di panel tabungan |
