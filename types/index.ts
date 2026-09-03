// =====================
// Cabang Olahraga
// =====================
export type CabangOlahraga = 'Basket' | 'Renang';

export interface CabangData {
  id: string;
  nama_cabang: CabangOlahraga;
  deskripsi: string;
  foto_url: string;
  nominal_spp_default: string;
  lokasi_utama: string;
}

// =====================
// Google Sheets Types
// =====================

export interface Branding {
  key: string;
  value: string;
}

export interface BrandingConfig {
  nama_club: string;
  tagline: string;
  logo_url: string;
  warna_primer: string;
  foto_hero_url: string;
  sejarah: string;
  visi: string;
  misi: string;
  tahun_berdiri: string;
  jumlah_prestasi: string;
  no_wa_admin: string;
  alamat_club: string;
  email_club: string;
  instagram: string;
  youtube: string;
  rek_bank_nama: string;
  rek_bank_nomor: string;
  rek_bank_atas_nama: string;
  qris_url: string;
  jatuh_tempo_spp: string;
  galeri_1?: string;
  galeri_2?: string;
  galeri_3?: string;
  galeri_4?: string;
  galeri_5?: string;
  galeri_6?: string;
  org_ketua?: string;
  org_sekretaris?: string;
  org_bendahara?: string;
  org_pelatih_kepala_basket?: string;
  org_pelatih_kepala_renang?: string;
}

export interface Pelatih {
  id: string;
  nama: string;
  cabang_olahraga: CabangOlahraga;
  foto_url: string;
  spesialisasi: string;
  sertifikasi: string;
  pengalaman: string;
  urutan: number;
}

export interface Prestasi {
  id: string;
  nama_atlet: string;
  kategori: CabangOlahraga;
  judul_prestasi: string;
  tingkat: 'kota' | 'provinsi' | 'nasional' | 'internasional';
  tahun: number;
  deskripsi?: string;
  foto_url: string;
  is_featured: boolean;
  urutan: number;
  created_at?: string;
  updated_at?: string;
}

export interface Anggota {
  id: string;
  nama: string;
  cabang_olahraga: CabangOlahraga;
  tanggal_lahir: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  alamat: string;
  no_hp: string;
  email: string;
  kategori: string;
  asal_sekolah?: string;
  kelas?: string;
  status: 'Aktif' | 'Nonaktif';
  tanggal_gabung: string;
}

export interface Pendaftar {
  id: string;
  nama: string;
  cabang_olahraga: CabangOlahraga;
  tanggal_lahir: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  alamat: string;
  no_hp: string;
  email: string;
  nama_wali: string;
  asal_sekolah?: string;
  kelas?: string;
  kategori: string;
  status_pendaftaran: 'Pending' | 'Diterima' | 'Ditolak';
  tanggal_daftar: string;
}

export interface Presensi {
  id: string;
  tanggal: string;
  cabang_olahraga: CabangOlahraga;
  id_anggota: string;
  nama_anggota: string;
  kategori: string;
  status_hadir: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  sesi: string;
}

export interface PembayaranSPP {
  id: string;
  id_anggota: string;
  nama_anggota: string;
  cabang_olahraga: CabangOlahraga;
  bulan: string;
  tahun: string;
  nominal: string;
  status_bayar: 'Lunas' | 'Belum' | 'Terlambat';
  tanggal_bayar: string;
  metode_bayar: 'Cash' | 'Transfer' | 'QRIS' | 'VA Bank' | 'Tunai' | '';
  payment_gateway_id?: string;
  status_gateway?: 'Pending' | 'Success' | 'Expired' | 'Failed' | '';
  nomor_kwitansi?: string;
  catatan?: string;
}

export interface Kas {
  id: string;
  tanggal: string;
  cabang_olahraga: string;
  jenis: 'Masuk' | 'Keluar';
  sumber: 'Manual' | 'Gateway';
  kategori: string;
  keterangan: string;
  nominal: string;
  saldo_berjalan: string;
}

export interface Jadwal {
  id: string;
  cabang_olahraga: CabangOlahraga;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  kategori: string;
  lokasi: string;
  jenis: 'Latihan' | 'Pertandingan';
  tanggal?: string;
  keterangan?: string;
}

export interface LogTransaksiGateway {
  id: string;
  order_id: string;
  id_anggota: string;
  nominal: string;
  metode: 'VA Bank' | 'QRIS';
  status: 'Pending' | 'Success' | 'Expired' | 'Failed';
  waktu_transaksi: string;
  raw_payload_ringkas: string;
}

export interface Admin {
  username: string;
  password_hash: string;
  role: string;
}

export interface SppKategori {
  id: string;
  cabang: CabangOlahraga;
  nama_kategori: string;
  usia_min?: number;
  usia_max?: number;
  nominal: number;
  urutan: number;
  is_active: boolean;
  created_at?: string;
}

export interface PengaturanPembayaran {
  id: string;
  tanggal_jatuh_tempo: string;
  catatan_keterlambatan: string;
  nomor_kwitansi_terakhir?: number;
  updated_at?: string;
}

export interface MetodePembayaran {
  id: string;
  nama: string;
  deskripsi?: string;
  nomor_rekening?: string;
  nama_bank?: string;
  atas_nama?: string;
  qris_image_url?: string;
  is_recommended: boolean;
  is_active: boolean;
  urutan: number;
  created_at?: string;
}

// =====================
// API Response Types
// =====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// =====================
// Payment Gateway Types
// =====================

export interface MidtransCreatePaymentRequest {
  orderId: string;
  amount: number;
  name: string;
  email: string;
  phone: string;
  idAnggota: string;
  namaAnggota: string;
  cabangOlahraga: CabangOlahraga;
  bulan: string;
  tahun: string;
  paymentType?: 'qris' | 'va';
}

export interface MidtransPaymentResponse {
  token: string;
  redirect_url: string;
  order_id: string;
}

// =====================
// Form Types
// =====================

export interface PendaftaranForm {
  nama: string;
  cabang_olahraga: CabangOlahraga;
  tanggal_lahir: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  alamat: string;
  no_hp: string;
  email: string;
  nama_wali: string;
  asal_sekolah?: string;
  kelas?: string;
  kategori: string;
}
