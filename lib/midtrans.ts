/**
 * DINONAKTIFKAN — Payment Gateway Midtrans tidak lagi digunakan.
 * 
 * Sistem pembayaran Barqignite Private Sport sekarang menggunakan
 * pencatatan manual (cash / transfer bank / QRIS langsung ke admin).
 * 
 * File ini dipertahankan sebagai stub kosong untuk mencegah compile error
 * jika ada sisa import yang belum dibersihkan.
 */

export function createSnapToken(): never {
  throw new Error('Payment gateway tidak digunakan. Sistem manual.');
}

export function checkTransactionStatus(): never {
  throw new Error('Payment gateway tidak digunakan. Sistem manual.');
}

export function verifyMidtransSignature(): boolean {
  return false;
}

export function parseMidtransStatus(): 'Failed' {
  return 'Failed';
}

export function parseMidtransPaymentMethod(): 'Transfer' {
  return 'Transfer';
}
