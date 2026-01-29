// Test script to verify API caching optimizations
// Run this with: tsx test-cache-optimization.ts

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testCryptoAPI() {
  console.log('🧪 Testing Crypto API with cache optimization...\n');
  
  const symbol = 'BTC';
  
  // First call - should use API if no cache
  console.log('1️⃣ First call (should hit API):');
  const start1 = Date.now();
  const response1 = await axios.get(`${BASE_URL}/api/crypto/bitkub?symbol=${symbol}`);
  const time1 = Date.now() - start1;
  console.log(`   Response time: ${time1}ms`);
  console.log(`   Source: ${response1.data.source}`);
  console.log(`   Cached: ${response1.data.cached}\n`);
  
  // Second call - should use cache
  console.log('2️⃣ Second call (should use cache):');
  const start2 = Date.now();
  const response2 = await axios.get(`${BASE_URL}/api/crypto/bitkub?symbol=${symbol}`);
  const time2 = Date.now() - start2;
  console.log(`   Response time: ${time2}ms`);
  console.log(`   Source: ${response2.data.source}`);
  console.log(`   Cached: ${response2.data.cached}`);
  console.log(`   Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%\n`);
  
  // Force refresh - should hit API
  console.log('3️⃣ Force refresh (should hit API):');
  const start3 = Date.now();
  const response3 = await axios.get(`${BASE_URL}/api/crypto/bitkub?symbol=${symbol}&refresh=true`);
  const time3 = Date.now() - start3;
  console.log(`   Response time: ${time3}ms`);
  console.log(`   Source: ${response3.data.source}`);
  console.log(`   Cached: ${response3.data.cached}\n`);
}

async function testStockAPI() {
  console.log('🧪 Testing Stock API with cache optimization...\n');
  
  const symbol = 'AAPL';
  
  // First call - should use API if no cache
  console.log('1️⃣ First call (should hit API):');
  const start1 = Date.now();
  const response1 = await axios.get(`${BASE_URL}/api/prices/stock?symbol=${symbol}`);
  const time1 = Date.now() - start1;
  console.log(`   Response time: ${time1}ms`);
  console.log(`   Source: ${response1.data.source}`);
  console.log(`   Cached: ${response1.data.cached}\n`);
  
  // Second call - should use cache
  console.log('2️⃣ Second call (should use cache):');
  const start2 = Date.now();
  const response2 = await axios.get(`${BASE_URL}/api/prices/stock?symbol=${symbol}`);
  const time2 = Date.now() - start2;
  console.log(`   Response time: ${time2}ms`);
  console.log(`   Source: ${response2.data.source}`);
  console.log(`   Cached: ${response2.data.cached}`);
  console.log(`   Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%\n`);
}

async function testBatchAPI() {
  console.log('🧪 Testing Batch API...\n');
  
  const symbols = 'BTC,ETH,ADA';
  
  // First call - should use cache if available
  console.log('1️⃣ Batch call:');
  const start1 = Date.now();
  const response1 = await axios.get(`${BASE_URL}/api/prices/batch?symbols=${symbols}&type=crypto`);
  const time1 = Date.now() - start1;
  console.log(`   Response time: ${time1}ms`);
  console.log(`   Results: ${response1.data.results.length} symbols`);
  response1.data.results.forEach((r: any) => {
    console.log(`   ${r.symbol}: ${r.source} (${r.cached ? 'cached' : 'live'})`);
  });
  console.log('');
}

async function testCryptoPriceAPI() {
  console.log('🧪 Testing Crypto Price API with cache optimization...\n');
  
  const symbol = 'BTC';
  
  // First call - should use API if no cache
  console.log('1️⃣ First call (should hit API):');
  const start1 = Date.now();
  const response1 = await axios.get(`${BASE_URL}/api/crypto/price?symbol=${symbol}`);
  const time1 = Date.now() - start1;
  console.log(`   Response time: ${time1}ms`);
  console.log(`   Source: ${response1.data.source}`);
  console.log(`   Cached: ${response1.data.cached}\n`);
  
  // Second call - should use cache
  console.log('2️⃣ Second call (should use cache):');
  const start2 = Date.now();
  const response2 = await axios.get(`${BASE_URL}/api/crypto/price?symbol=${symbol}`);
  const time2 = Date.now() - start2;
  console.log(`   Response time: ${time2}ms`);
  console.log(`   Source: ${response2.data.source}`);
  console.log(`   Cached: ${response2.data.cached}`);
  console.log(`   Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%\n`);
}

async function main() {
  console.log('🚀 Testing API Cache Optimization\n');
  console.log('Make sure your dev server is running on http://localhost:3000\n');
  
  try {
    await testCryptoAPI();
    await testCryptoPriceAPI();
    await testStockAPI();
    await testBatchAPI();
    
    console.log('✅ All tests completed!');
    console.log('\n📝 Summary:');
    console.log('- APIs now check price_cache table first for instant responses');
    console.log('- Background updates keep cache fresh without blocking UI');
    console.log('- Force refresh option available with ?refresh=true');
    console.log('- Batch API available for multiple symbols at once');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nMake sure:');
    console.log('1. Dev server is running: npm run dev');
    console.log('2. Supabase is configured');
    console.log('3. Database has price_cache table');
  }
}

if (require.main === module) {
  main();
}
