import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Prestasi } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    const is_featured = searchParams.get('is_featured');

    let query = supabase.from('prestasi').select('*');
    
    if (kategori) query = query.eq('kategori', kategori);
    if (is_featured === 'true') query = query.eq('is_featured', true);

    const { data, error } = await query.order('urutan', { ascending: true }).order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Prestasi GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data prestasi' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    const nama_atlet = formData.get('nama_atlet') as string;
    const kategori = formData.get('kategori') as string;
    const judul_prestasi = formData.get('judul_prestasi') as string;
    const tingkat = formData.get('tingkat') as string;
    const tahun = parseInt(formData.get('tahun') as string);
    const deskripsi = formData.get('deskripsi') as string;
    const is_featured = formData.get('is_featured') === 'true';
    const urutan = parseInt(formData.get('urutan') as string) || 99;
    const file = formData.get('foto') as File | null;

    let foto_url = '';

    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prestasi-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('prestasi-photos')
        .getPublicUrl(fileName);
        
      foto_url = urlData.publicUrl;
    }

    const newPrestasi = {
      nama_atlet,
      kategori,
      judul_prestasi,
      tingkat,
      tahun,
      deskripsi,
      foto_url,
      is_featured,
      urutan
    };

    const { data, error } = await supabase
      .from('prestasi')
      .insert([newPrestasi])
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Prestasi berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Prestasi POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan prestasi' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    const id = formData.get('id') as string;
    const nama_atlet = formData.get('nama_atlet') as string;
    const kategori = formData.get('kategori') as string;
    const judul_prestasi = formData.get('judul_prestasi') as string;
    const tingkat = formData.get('tingkat') as string;
    const tahun = parseInt(formData.get('tahun') as string);
    const deskripsi = formData.get('deskripsi') as string;
    const is_featured = formData.get('is_featured') === 'true';
    const urutan = parseInt(formData.get('urutan') as string) || 99;
    const old_foto_url = formData.get('old_foto_url') as string;
    const file = formData.get('foto') as File | null;

    let foto_url = old_foto_url;

    if (file && file.size > 0) {
      // 1. Upload new photo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prestasi-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('prestasi-photos')
        .getPublicUrl(fileName);
        
      foto_url = urlData.publicUrl;

      // 2. Delete old photo if exists
      if (old_foto_url) {
        const urlParts = old_foto_url.split('/prestasi-photos/');
        if (urlParts.length > 1) {
          const oldFileName = urlParts[1];
          await supabase.storage.from('prestasi-photos').remove([oldFileName]);
        }
      }
    }

    const updateData = {
      nama_atlet,
      kategori,
      judul_prestasi,
      tingkat,
      tahun,
      deskripsi,
      foto_url,
      is_featured,
      urutan
    };

    const { error } = await supabase
      .from('prestasi')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Prestasi berhasil diperbarui' });
  } catch (error) {
    console.error('Prestasi PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui prestasi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const fotoUrl = searchParams.get('foto_url');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    // 1. Hapus record dari db
    const { error } = await supabase.from('prestasi').delete().eq('id', id);
    if (error) throw error;

    // 2. Hapus foto dari storage
    if (fotoUrl) {
      const urlParts = fotoUrl.split('/prestasi-photos/');
      if (urlParts.length > 1) {
        const fileName = urlParts[1];
        await supabase.storage.from('prestasi-photos').remove([fileName]);
      }
    }

    return NextResponse.json({ success: true, message: 'Data prestasi berhasil dihapus' });
  } catch (error) {
    console.error('Prestasi DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus prestasi' }, { status: 500 });
  }
}
