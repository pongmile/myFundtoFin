/**
 * Database Setup Script
 * Run with: npx tsx scripts/setup-database.ts
 * 
 * This script will automatically create all required tables in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for DDL

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.log('Required:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard > Settings > API)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');

  // Read the SQL schema file
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ supabase-schema.sql not found!');
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Split by semicolons and filter empty statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  let success = 0;
  let failed = 0;

  for (const statement of statements) {
    const firstLine = statement.split('\n')[0].substring(0, 60);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct query for CREATE statements
        const { error: directError } = await supabase.from('_migrations').select('*').limit(0);
        
        // If table doesn't exist, that's expected
        if (directError?.message?.includes('does not exist')) {
          console.log(`⏭️  Skipped: ${firstLine}...`);
        } else {
          console.log(`⚠️  Warning: ${firstLine}... - ${error.message}`);
        }
        failed++;
      } else {
        console.log(`✅ ${firstLine}...`);
        success++;
      }
    } catch (err) {
      console.log(`⏭️  ${firstLine}...`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Completed: ${success} statements`);
  console.log(`⚠️  Skipped/Failed: ${failed} statements`);
  console.log('='.repeat(50));
  
  // Verify tables exist
  console.log('\n🔍 Verifying tables...\n');
  
  const tables = ['cash_accounts', 'stocks', 'crypto', 'liabilities', 'wealth_history', 'price_cache'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ ${table} - ${error.message}`);
    } else {
      console.log(`✅ ${table} - OK`);
    }
  }

  console.log('\n🎉 Database setup complete!');
}

setupDatabase().catch(console.error);
