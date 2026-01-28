import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log('🔧 Running migration with service role key...\n');

  try {
    // Run ALTER TABLE command using RPC or raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'cash_accounts' AND column_name = 'account_name'
          ) THEN
            ALTER TABLE cash_accounts ADD COLUMN account_name TEXT NOT NULL DEFAULT 'บัญชีหลัก';
            RAISE NOTICE 'Column account_name added';
          ELSE
            RAISE NOTICE 'Column already exists';
          END IF;
        END $$;
      `
    });

    if (error) {
      // If RPC doesn't exist, try direct approach
      console.log('⚠️  RPC method not available, trying direct SQL...');
      
      // Simple check by trying to select
      const { data, error: selectError } = await supabase
        .from('cash_accounts')
        .select('account_name')
        .limit(1);

      if (selectError && selectError.message.includes('column')) {
        console.log('❌ Column does not exist. Please run this SQL in Supabase SQL Editor:\n');
        console.log('ALTER TABLE cash_accounts ADD COLUMN IF NOT EXISTS account_name TEXT NOT NULL DEFAULT \'บัญชีหลัก\';');
        return false;
      }

      console.log('✅ Column account_name already exists or migration complete');
      return true;
    }

    console.log('✅ Migration successful!');
    return true;

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function main() {
  const success = await runMigration();
  
  if (success) {
    console.log('\n✅ Ready to run: npx tsx scripts/seed-data.ts');
  }
}

main();
