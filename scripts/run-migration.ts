import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 Running migration: Add account_name column...\n');

  // Check if column exists
  const { data: columns, error: checkError } = await supabase
    .from('cash_accounts')
    .select('*')
    .limit(1);

  if (checkError) {
    console.error('❌ Error checking table:', checkError);
    return false;
  }

  // Check if any existing data has account_name
  if (columns && columns.length > 0) {
    if ('account_name' in columns[0]) {
      console.log('✅ Column account_name already exists');
      return true;
    }
  }

  console.log('⚠️  Cannot add column via client API');
  console.log('📝 Please run this SQL in Supabase SQL Editor:\n');
  console.log('ALTER TABLE cash_accounts ADD COLUMN IF NOT EXISTS account_name TEXT NOT NULL DEFAULT \'บัญชีหลัก\';\n');
  
  return false;
}

async function main() {
  await runMigration();
}

main();
