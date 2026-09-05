import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function generateId(prefix: string = 'ID'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

// Ambil nama hari (Senin-Minggu) secara aman dalam WIB
function getNamaHariWIB(date: Date): string {
  const dayNameEn = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' }).format(date);
  const map: Record<string, string> = {
    Sun: 'Minggu', Mon: 'Senin', Tue: 'Selasa', Wed: 'Rabu', Thu: 'Kamis', Fri: 'Jumat', Sat: 'Sabtu'
  };
  return map[dayNameEn] || 'Senin';
}

function parseTimeToMinutes(timeStr: string) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// GET: Ambil sesi latihan hari ini (dari tabel jadwal, berdasarkan hari)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const debugTime = searchParams.get('debug_time');
    const now = debugTime ? new Date(debugTime) : new Date();

    const namaHari = getNamaHariWIB(now);

    // Ambil semua jadwal yang hari-nya cocok dengan hari ini (WIB)
    const { data: jadwalHariIni, error } = await supabase
      .from('jadwal')
      .select('id, kategori, jam_mulai, jam_selesai, jenis, keterangan, cabang_olahraga')
      .eq('hari', namaHari)
      .order('jam_mulai', { ascending: true });

    if (error) throw error;

    // Format waktu saat ini ke menit (zona waktu WIB / lokal server)
    const timeWIB = new Intl.DateTimeFormat('en-GB', { 
      timeZone: 'Asia/Jakarta', 
      hour: '2-digit', 
      minute: '2-digit', 
      hourCycle: 'h23' 
    }).format(now);
    
    const [wibHourStr, wibMinuteStr] = timeWIB.split(':');
    const currentTotalMinutes = parseInt(wibHourStr, 10) * 60 + parseInt(wibMinuteStr, 10);

    // Filter sesi yang sedang berlangsung
    const activeSessions = (jadwalHariIni || []).filter((j) => {
      const startMins = parseTimeToMinutes(j.jam_mulai);
      const endMins = parseTimeToMinutes(j.jam_selesai);
      // Cek apakah waktu saat ini berada di dalam rentang (inklusif)
      return currentTotalMinutes >= startMins && currentTotalMinutes <= endMins;
    });

    // Format label sesi untuk UI (hanya rentang jam tanpa kategori)
    const sesiList = activeSessions.map((j) => {
      const label = `${j.jam_mulai}–${j.jam_selesai}`;
      return { id: j.id, label, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, kategori: j.kategori, jenis: j.jenis, cabang_olahraga: j.cabang_olahraga };
    });

    return NextResponse.json({
      success: true,
      hari: namaHari,
      waktu_wib_saat_ini: timeWIB, // Untuk keperluan debug info
      data: sesiList,
    });
  } catch (error) {
    console.error('Presensi Public GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil jadwal hari ini.' },
      { status: 500 }
    );
  }
}

// POST: Siswa submit laporan kedatangan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, sesi_id, sesi_label, debug_time } = body;

    if (!email || (!sesi_id && !sesi_label)) {
      return NextResponse.json(
        { success: false, error: 'Email dan sesi latihan wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Cari anggota berdasarkan email
    const { data: anggota, error: errAnggota } = await supabase
      .from('anggota')
      .select('*')
      .ilike('email', email.trim())
      .single();

    if (errAnggota || !anggota) {
      return NextResponse.json(
        { success: false, error: 'Email tidak terdaftar di sistem kami.' },
        { status: 404 }
      );
    }

    if (anggota.status !== 'Aktif') {
      return NextResponse.json(
        { success: false, error: 'Status keanggotaan Anda saat ini tidak aktif.' },
        { status: 403 }
      );
    }

    // 2. Waktu & tanggal server WIB
    const now = debug_time ? new Date(debug_time) : new Date();
    
    // Format: YYYY-MM-DD dalam timezone Asia/Jakarta
    const todayISO = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Jakarta', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).format(now);
    
    const waktuSubmit = now.toISOString(); // Timestamp mutlak untuk disimpan (TIMESTAMPTZ)

    // Label sesi yang disimpan ke DB
    const sesiLabel = sesi_label || sesi_id;

    // 3. Cek apakah sudah presensi hari ini untuk sesi yang sama
    const { data: existing } = await supabase
      .from('presensi')
      .select('id, status_hadir, waktu_submit')
      .eq('id_anggota', anggota.id)
      .eq('tanggal', todayISO)
      .eq('sesi', sesiLabel)
      .maybeSingle();

    if (existing) {
      // Sudah pernah submit untuk sesi & tanggal ini
      let sudahJam = 'hari ini';
      if (existing.waktu_submit) {
        sudahJam = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23'
        }).format(new Date(existing.waktu_submit));
      }

      return NextResponse.json(
        {
          success: false,
          error: `Kamu sudah submit presensi untuk sesi ini pada pukul ${sudahJam} WIB. Menunggu konfirmasi admin.`,
          already_submitted: true,
          waktu_submit: existing.waktu_submit,
          status: existing.status_hadir,
        },
        { status: 409 }
      );
    }

    // 4. Insert presensi dengan status 'Menunggu Konfirmasi'
    const presensiData = {
      id: generateId('PRE'),
      tanggal: todayISO,
      cabang_olahraga: anggota.cabang_olahraga,
      id_anggota: anggota.id,
      nama_anggota: anggota.nama,
      kategori: anggota.kategori,
      status_hadir: 'Menunggu Konfirmasi',
      sesi: sesiLabel,
      waktu_submit: waktuSubmit,
    };

    const { error: insertError } = await supabase
      .from('presensi')
      .insert([presensiData]);

    if (insertError) throw insertError;

    // Format jam lokal (WIB) untuk pesan konfirmasi ke siswa
    const jamWIB = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).format(now);

    return NextResponse.json({
      success: true,
      message: `Presensi berhasil dicatat!`,
      data: {
        nama: anggota.nama,
        cabang: anggota.cabang_olahraga,
        waktu_submit: waktuSubmit,
        jam_wib: jamWIB,
        sesi: sesiLabel,
        status: 'Menunggu Konfirmasi',
      },
    });

  } catch (error) {
    console.error('Presensi Public POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
