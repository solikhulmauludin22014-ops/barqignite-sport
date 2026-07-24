# PANDUAN SETUP — Barqignite Private Sport Sidoarjo

## ⚡ LANGKAH PERTAMA: Install Dependencies

Buka Terminal / Command Prompt, lalu jalankan:

```bash
cd "d:\PT CLING MEDIA\barqignite private sidoarjo"
npm install
npm run dev
```

Buka browser: **http://localhost:3000**

---

## 1. Persiapan Google Sheets

### Buat Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.google.com) → buat spreadsheet baru
2. Beri nama: **"Barqignite Private Sport Database"**
3. Catat URL — ambil ID dari: `https://docs.google.com/spreadsheets/d/[ID_INI]/edit`

### Buat 11 Tab/Sheet dengan Nama dan Kolom Berikut:

#### Tab: `Branding`
Format key-value, 2 kolom: **key** | **value**

| key | Contoh Value |
|-----|------|
| nama_club | Barqignite Private Sport Sidoarjo |
| tagline | Membentuk Atlet Basket & Renang Berprestasi |
| tahun_berdiri | 2018 |
| jumlah_prestasi | 30+ |
| no_wa_admin | 6281234567890 |
| alamat_club | Jl. ... Sidoarjo |
| email_club | info@barqignite.com |
| instagram | @barqignitesport |
| rek_bank_nama | BCA |
| rek_bank_nomor | 1234567890 |
| rek_bank_atas_nama | Barqignite Sport |
| jatuh_tempo_spp | Tanggal 10 setiap bulan |
| sejarah | (isi teks sejarah club) |
| visi | (isi visi) |
| misi | (isi misi) |
| galeri_1 | (URL foto kegiatan) |

#### Tab: `Cabang_Olahraga`
Kolom: `id | nama_cabang | deskripsi | foto_url | nominal_spp_default | lokasi_utama`

Isi 2 baris default:
- `1 | Basket | Deskripsi basket | (url foto) | 250000 | Lapangan Basket Indoor`
- `2 | Renang | Deskripsi renang | (url foto) | 300000 | Kolam Renang Sport Center`

#### Tab: `Pelatih`
Kolom: `id | nama | cabang_olahraga | foto_url | spesialisasi | sertifikasi | pengalaman | urutan`

#### Tab: `Anggota`
Kolom: `id | nama | cabang_olahraga | tanggal_lahir | jenis_kelamin | alamat | no_hp | email | kategori | status | tanggal_gabung`

#### Tab: `Pendaftar`
Kolom: `id | nama | cabang_olahraga | tanggal_lahir | jenis_kelamin | alamat | no_hp | email | nama_wali | kategori | status_pendaftaran | tanggal_daftar`

#### Tab: `Presensi`
Kolom: `id | tanggal | cabang_olahraga | id_anggota | nama_anggota | kategori | status_hadir | sesi`

#### Tab: `Pembayaran_SPP`
Kolom: `id | id_anggota | nama_anggota | cabang_olahraga | bulan | tahun | nominal | status_bayar | tanggal_bayar | metode_bayar | payment_gateway_id | status_gateway`

#### Tab: `Kas`
Kolom: `id | tanggal | cabang_olahraga | jenis | sumber | kategori | keterangan | nominal | saldo_berjalan`

#### Tab: `Jadwal`
Kolom: `id | cabang_olahraga | hari | jam_mulai | jam_selesai | kategori | lokasi | jenis | tanggal | keterangan`

#### Tab: `Log_Transaksi_Gateway`
Kolom: `id | order_id | id_anggota | nominal | metode | status | waktu_transaksi | raw_payload_ringkas`

#### Tab: `Admin`
Kolom: `username | password_hash | role`

---

## 2. Setup Google Cloud & Service Account

### A. Buat Project Google Cloud
1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Klik **New Project** → beri nama "Barqignite Sport" → Create
3. Pilih project tersebut

### B. Aktifkan Google Sheets API
1. **APIs & Services** → **Library**
2. Cari "Google Sheets API" → **Enable**

### C. Buat Service Account
1. **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **Service Account**
3. Isi nama → Create → Role: **Editor** → Done
4. Klik service account → **Keys** → **Add Key** → **Create new key** → JSON → Create
5. File JSON terdownload — **SIMPAN BAIK-BAIK!**

### D. Share Spreadsheet ke Service Account
1. Dari JSON key, cari `"client_email"` (contoh: `barqignite@project.iam.gserviceaccount.com`)
2. Buka Google Sheets → klik **Share**
3. Masukkan email service account → pilih **Editor** → Send

---

## 3. Setup Payment Gateway — Midtrans

### A. Daftar Akun Midtrans
1. Buka [dashboard.midtrans.com](https://dashboard.midtrans.com) → Register
2. Pilih mode **Sandbox** dulu untuk testing
3. Verifikasi email dan lengkapi profil

### B. Dapatkan API Key
1. Login dashboard Midtrans
2. **Settings** → **Access Keys**
3. Copy **Server Key** dan **Client Key** (Sandbox)

### C. Daftarkan URL Webhook
1. **Settings** → **Configuration**
2. Pada kolom **Payment Notification URL**:
   ```
   https://your-domain.com/api/webhook/payment
   ```
   Untuk development (gunakan ngrok):
   ```bash
   npx ngrok http 3000
   # Gunakan URL yang diberikan: https://xxxx.ngrok.io/api/webhook/payment
   ```
3. Klik **Save**

### D. Uji Pembayaran Sandbox
- Di dashboard Midtrans → **Transaction Test** untuk simulasi pembayaran
- Atau gunakan nomor VA/QRIS sandbox dari [docs.midtrans.com](https://docs.midtrans.com/en/technical-reference/sandbox-test)

---

## 4. Konfigurasi File .env.local

Buat file `.env.local` dari template `.env.example`:

```env
# Google Sheets
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SERVICE_ACCOUNT_EMAIL=barqignite@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADA...\n-----END PRIVATE KEY-----\n"

# NextAuth
NEXTAUTH_SECRET=generate_dengan_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000

# Admin Login
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password_aman_anda

# Midtrans (Sandbox)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false

# Midtrans (Production — aktifkan saat go-live)
# MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxx
# MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxx
# MIDTRANS_IS_PRODUCTION=true

# Public (exposed to browser)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Tips GOOGLE_PRIVATE_KEY:**
- Copy nilai `private_key` dari file JSON (termasuk `-----BEGIN...-----`)
- Pastikan `\n` di dalam string ENV tetap sebagai `\n` (bukan newline sebenarnya)
- Di Vercel, paste nilainya langsung di kolom Environment Variable

---

## 5. Jalankan Aplikasi

```bash
npm install
npm run dev
# Buka: http://localhost:3000
# Admin: http://localhost:3000/admin/login
```

---

## 6. Testing Payment Gateway (Sandbox)

1. Buat tagihan dari panel admin `/admin/pembayaran` → klik tombol QRIS (ikon QR)
2. Popup Midtrans Snap akan muncul
3. Gunakan metode bayar sandbox:
   - QRIS: scan QR dengan kamera, anggap berhasil
   - VA: gunakan panduan di [docs.midtrans.com/en/technical-reference/sandbox-test](https://docs.midtrans.com/en/technical-reference/sandbox-test)
4. Setelah "bayar", webhook otomatis diterima → status SPP berubah ke "Lunas" dalam 5 detik (auto-refresh)

---

## 7. Deploy ke Vercel (Production)

```bash
# Install Vercel CLI (opsional)
npm i -g vercel
vercel

# Atau via GitHub:
# 1. Push ke GitHub
# 2. Buka vercel.com → New Project → Import repo
# 3. Tambahkan semua Environment Variables dari .env.local
# 4. Deploy!
```

**Penting saat deploy:**
- Ubah `NEXTAUTH_URL` ke URL production (contoh: `https://barqignite.vercel.app`)
- Ubah `NEXT_PUBLIC_APP_URL` ke URL production
- Daftarkan URL webhook production ke dashboard Midtrans
- Saat siap production: ubah semua key Midtrans ke **Production** dan `MIDTRANS_IS_PRODUCTION=true`

---

## 8. Catatan Penting

- **Rate Limit Google Sheets:** 300 request/menit — sudah dilindungi cache ISR 60 detik
- **Webhook Security:** Signature Midtrans diverifikasi setiap request untuk mencegah pemalsuan
- **Auto-refresh Dashboard:** Panel admin refresh data setiap 5–10 detik via SWR
- **Backup:** Backup Google Sheets secara berkala via File → Download → .xlsx
- **Admin branding:** Edit semua konten club via `/admin/branding` tanpa deploy ulang
