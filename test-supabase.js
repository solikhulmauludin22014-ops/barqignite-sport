require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCRUD() {
  console.log('Testing Supabase CRUD...');
  
  // 1. CREATE
  console.log('\n1. CREATE (Insert)');
  const testId = 'TEST-' + Date.now();
  const { data: insertData, error: insertError } = await supabase
    .from('pelatih')
    .insert([
      {
        id: testId,
        nama: 'Test Pelatih',
        cabang_olahraga: 'Panahan',
        spesialisasi: 'Pemula',
        pengalaman: '1 Tahun',
        urutan: 999
      }
    ])
    .select();
    
  if (insertError) {
    console.error('❌ Insert Error:', insertError);
    return;
  }
  console.log('✅ Insert Success:', insertData);

  // 2. READ
  console.log('\n2. READ (Select)');
  const { data: readData, error: readError } = await supabase
    .from('pelatih')
    .select('*')
    .eq('id', testId);
    
  if (readError) {
    console.error('❌ Read Error:', readError);
    return;
  }
  console.log('✅ Read Success:', readData);

  // 3. UPDATE
  console.log('\n3. UPDATE');
  const { data: updateData, error: updateError } = await supabase
    .from('pelatih')
    .update({ nama: 'Test Pelatih Updated' })
    .eq('id', testId)
    .select();
    
  if (updateError) {
    console.error('❌ Update Error:', updateError);
    return;
  }
  console.log('✅ Update Success:', updateData);

  // 4. DELETE
  console.log('\n4. DELETE');
  const { data: deleteData, error: deleteError } = await supabase
    .from('pelatih')
    .delete()
    .eq('id', testId)
    .select();
    
  if (deleteError) {
    console.error('❌ Delete Error:', deleteError);
    return;
  }
  console.log('✅ Delete Success:', deleteData);
  
  console.log('\n🎉 CRUD Test Completed successfully!');
}

testCRUD();
