const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://clkehulxubwdezymcnnr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsa2VodWx4dWJ3ZGV6eW1jbm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4ODU1OTQsImV4cCI6MjEwMDQ2MTU5NH0.NPRNhwGwdXQRS6V8Ln0w9z1AIN4Rt0GeAqt9LESnOPo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getAdmin() {
  const { data, error } = await supabase.from('admin').select('*');
  console.log('Admins:', data);
  if (error) console.error('Error:', error);
}

getAdmin();
