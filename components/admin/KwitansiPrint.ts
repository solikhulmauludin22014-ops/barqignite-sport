'use client';

import { formatCurrency, getMonthName, terbilang } from '@/lib/utils';
import type { PembayaranSPP } from '@/types';

interface KwitansiData {
  pembayaran: PembayaranSPP;
  namaClub?: string;
  logoUrl?: string;
}

// Generate dan print kwitansi menggunakan browser print (no external lib needed)
export async function printKwitansi({ pembayaran, namaClub = 'BARQIGNITE PRIVATE SPORT', logoUrl }: KwitansiData) {
  // Buka window secara sinkron untuk menghindari pemblokiran pop-up browser
  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  if (!printWindow) {
    alert('Pop-up diblokir oleh browser. Harap izinkan pop-up untuk mencetak kwitansi.');
    return;
  }
  
  // Loading sementara
  printWindow.document.write('<div style="padding:20px;font-family:sans-serif;">Menyiapkan dokumen kwitansi...</div>');

  let base64Logo = '';
  try {
    const url = logoUrl || `${window.location.origin}/logo-barqignite.png`;
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      base64Logo = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    console.error('Gagal convert logo ke base64:', e);
  }

  const date = pembayaran.tanggal_bayar ? new Date(pembayaran.tanggal_bayar) : new Date();
  const tanggalText = `${date.getDate()} ${getMonthName(String(date.getMonth() + 1))} ${date.getFullYear()}`;
  const nominal = parseFloat(pembayaran.nominal || '0');
  const terbilangText = terbilang(nominal);
  const metode = pembayaran.metode_bayar || 'Cash';
  const noKwitansi = pembayaran.nomor_kwitansi || 'N/A';

  const logoSrc = base64Logo || logoUrl || '/logo-barqignite.png';
  const logoHtml = `<img src="${logoSrc}" alt="Logo" style="height:50px;width:50px;object-fit:contain;" onError="this.style.display='none'" />`;

  const halfContent = (label: string) => `
    <div style="flex:1; border: 2px dashed #ccc; border-radius: 12px; padding: 25px; position: relative; background: #fff;">
      <div style="position: absolute; top: -12px; right: 20px; background: #fff; padding: 0 10px; font-weight: bold; color: #666; font-size: 14px; border: 2px dashed #ccc; border-radius: 20px;">
        ${label}
      </div>
      
      <div style="display:flex;align-items:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #eee;">
        ${logoHtml}
        <div style="margin-left:15px;">
          <div style="font-size:18px;font-weight:900;color:#1a1a2e;letter-spacing:1px;text-transform:uppercase;">${namaClub}</div>
          <div style="font-size:11px;color:#666;margin-top:2px;">TANDA BUKTI PEMBAYARAN SAH</div>
        </div>
      </div>

      <table style="width:100%;font-size:12px;line-height:1.4;border-collapse:collapse;">
        <tr>
          <td style="width:140px;padding:4px 0;color:#555;">No. Kwitansi</td>
          <td style="padding:4px 0;color:#333;font-weight:bold;">: ${noKwitansi}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">Telah Terima Dari</td>
          <td style="padding:4px 0;color:#333;font-weight:bold;">: ${pembayaran.nama_anggota}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">Untuk Pembayaran</td>
          <td style="padding:4px 0;color:#333;">: SPP Bulan ${pembayaran.bulan} ${pembayaran.tahun}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">Nominal</td>
          <td style="padding:4px 0;color:#1a1a2e;font-weight:700;font-size:13px;">: ${formatCurrency(nominal)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">Terbilang</td>
          <td style="padding:4px 0;color:#555;font-style:italic;">: ( ${terbilangText} )</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">Tanggal Bayar</td>
          <td style="padding:4px 0;color:#333;">: ${tanggalText}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">Metode Pembayaran</td>
          <td style="padding:4px 0;color:#333;">: ${metode}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">Status</td>
          <td style="padding:4px 0;">: <span style="background:#16a34a;color:white;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;">✓ LUNAS</span></td>
        </tr>
        ${pembayaran.catatan ? `<tr>
          <td style="padding:4px 0;color:#555;">Catatan</td>
          <td style="padding:4px 0;color:#555;font-style:italic;">: ${pembayaran.catatan}</td>
        </tr>` : ''}
      </table>

      <div style="display:flex;justify-content:flex-end;margin-top:18px;padding-top:12px;border-top:1px solid #eee;">
        <div style="text-align:center;">
          <div style="font-size:10px;color:#666;margin-bottom:36px;">Petugas,</div>
          <div style="border-top:1px solid #999;padding-top:4px;font-size:10px;color:#555;min-width:120px;">( __________________ )</div>
        </div>
      </div>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Kwitansi ${noKwitansi}</title>
      <style>
        @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: white; color: #1a1a2e; }
        .page { display: flex; flex-direction: column; min-height: 267mm; /* A4 height minus margins */ justify-content: space-between; }
        .cut-line {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #999;
          font-size: 10px;
          margin: 4px 0;
        }
        .cut-line::before, .cut-line::after {
          content: '';
          flex: 1;
          border-top: 1.5px dashed #bbb;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div style="flex:1;">
          ${halfContent('LEMBAR ANGGOTA')}
          <div class="cut-line">✂&nbsp;&nbsp;GUNTING DI SINI&nbsp;&nbsp;✂</div>
          ${halfContent('LEMBAR ARSIP CLUB')}
        </div>
        <div style="text-align:center;font-size:9px;color:#bbb;margin-top:8px;">
          Dicetak pada: ${new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; ${namaClub}
        </div>
      </div>
    </body>
    </html>
  `;

  if (printWindow.closed) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Berikan jeda sejenak agar stylesheet dan gambar selesai dimuat sebelum dialog cetak muncul
  setTimeout(() => {
    try {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
      }
    } catch (err) {
      console.error('Print trigger error:', err);
    }
  }, 400);
}
