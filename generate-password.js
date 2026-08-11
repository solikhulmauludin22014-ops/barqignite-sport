const bcrypt = require('bcryptjs');

const plaintextPassword = process.argv[2];

if (!plaintextPassword) {
  console.log('Gunakan perintah: node generate-password.js "password_baru_anda"');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(plaintextPassword, saltRounds);

console.log('--- HASIL BCRYPT HASH ---');
console.log('Password asli:', plaintextPassword);
console.log('Hash (copy ini):', hash);
console.log('-------------------------');
console.log('Cara Penggunaan:');
console.log('1. Buka dashboard Supabase Anda (Table Editor -> tabel "admin")');
console.log('2. Ganti isi kolom "password_hash" dengan hash di atas (yang berawalan $2a$ atau $2b$)');
console.log('3. Coba login ulang di web dengan password asli Anda.');
