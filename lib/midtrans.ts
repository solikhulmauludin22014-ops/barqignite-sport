/**
 * Midtrans Payment Gateway Integration
 * Dokumentasi: https://docs.midtrans.com/
 */

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const MIDTRANS_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

const MIDTRANS_SNAP_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1';

function getAuthHeader(): string {
  const encoded = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
  return `Basic ${encoded}`;
}

// ============================================================
// CREATE SNAP PAYMENT TOKEN
// Membuat token pembayaran Midtrans Snap (popup VA + QRIS + dll)
// ============================================================
export async function createSnapToken(params: {
  order_id: string;
  gross_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  item_name: string;
  payment_type?: 'qris' | 'bank_transfer' | 'all';
}): Promise<{ token: string; redirect_url: string }> {
  const body: Record<string, unknown> = {
    transaction_details: {
      order_id: params.order_id,
      gross_amount: params.gross_amount,
    },
    customer_details: {
      first_name: params.customer_name,
      email: params.customer_email,
      phone: params.customer_phone,
    },
    item_details: [
      {
        id: params.order_id,
        price: params.gross_amount,
        quantity: 1,
        name: params.item_name,
      },
    ],
  };

  // Batasi metode bayar jika diminta
  if (params.payment_type === 'qris') {
    body.enabled_payments = ['gopay', 'qris'];
  } else if (params.payment_type === 'bank_transfer') {
    body.enabled_payments = ['bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'permata_va'];
  }

  const res = await fetch(`${MIDTRANS_SNAP_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Midtrans Snap error: ${res.status} — ${errorBody}`);
  }

  const data = await res.json();
  return { token: data.token, redirect_url: data.redirect_url };
}

// ============================================================
// CHECK TRANSACTION STATUS
// ============================================================
export async function checkTransactionStatus(orderId: string): Promise<{
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  gross_amount?: string;
}> {
  const res = await fetch(`${MIDTRANS_BASE_URL}/${orderId}/status`, {
    headers: { Authorization: getAuthHeader() },
  });

  if (!res.ok) {
    throw new Error(`Midtrans status check error: ${res.status}`);
  }

  return res.json();
}

// ============================================================
// VERIFY WEBHOOK NOTIFICATION SIGNATURE
// Midtrans mengirim SHA512 signature untuk verifikasi
// ============================================================
export function verifyMidtransSignature(params: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  server_key: string;
  signature_key: string; // dari payload webhook
}): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHash('sha512')
    .update(
      `${params.order_id}${params.status_code}${params.gross_amount}${params.server_key}`
    )
    .digest('hex');

  return hash === params.signature_key;
}

// ============================================================
// PARSE PAYMENT STATUS FROM MIDTRANS
// Menentukan status berdasarkan transaction_status & fraud_status
// ============================================================
export function parseMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): 'Success' | 'Pending' | 'Failed' | 'Expired' {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'accept' ? 'Success' : 'Failed';
  }
  if (transactionStatus === 'settlement') return 'Success';
  if (transactionStatus === 'pending') return 'Pending';
  if (['deny', 'cancel', 'failure'].includes(transactionStatus)) return 'Failed';
  if (transactionStatus === 'expire') return 'Expired';
  return 'Pending';
}

// ============================================================
// PARSE PAYMENT METHOD FROM MIDTRANS
// ============================================================
export function parseMidtransPaymentMethod(
  paymentType: string
): 'VA Bank' | 'QRIS' | 'Transfer' {
  if (['gopay', 'qris', 'shopeepay'].includes(paymentType)) return 'QRIS';
  if (paymentType.includes('va') || paymentType === 'bank_transfer') return 'VA Bank';
  return 'Transfer';
}
