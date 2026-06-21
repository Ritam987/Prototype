#!/usr/bin/env node
/**
 * Supabase Keys Validation Test
 * 
 * This script checks if your Supabase keys are valid JWT tokens.
 * Run: node test-supabase-keys.js
 */

require('dotenv').config();

function isValidJWT(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // JWT has 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Each part should be base64url encoded
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if it looks like a Supabase JWT
    if (header.alg && payload.iss) {
      return true;
    }
  } catch (e) {
    return false;
  }
  
  return false;
}

function checkKey(name, value) {
  console.log(`\n🔍 Checking ${name}...`);
  
  if (!value) {
    console.log(`   ❌ NOT SET - Environment variable is missing`);
    return false;
  }
  
  if (value.startsWith('sb_publishable_') || value.startsWith('sb_secret_')) {
    console.log(`   ❌ INVALID - This is a placeholder, not a real JWT token`);
    console.log(`   💡 Real keys start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`);
    return false;
  }
  
  if (!value.startsWith('eyJ')) {
    console.log(`   ❌ INVALID - JWT tokens must start with "eyJ"`);
    return false;
  }
  
  if (!isValidJWT(value)) {
    console.log(`   ❌ INVALID - Not a valid JWT token format`);
    return false;
  }
  
  console.log(`   ✅ VALID - Looks like a proper JWT token`);
  console.log(`   📝 Preview: ${value.substring(0, 50)}...`);
  return true;
}

console.log('═══════════════════════════════════════════════════');
console.log('   Supabase Keys Validation Test');
console.log('═══════════════════════════════════════════════════');

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`\n📦 Supabase URL: ${supabaseUrl || '(not set)'}`);

const anonValid = checkKey('SUPABASE_ANON_KEY', anonKey);
const serviceValid = checkKey('SUPABASE_SERVICE_ROLE_KEY', serviceKey);

console.log('\n═══════════════════════════════════════════════════');
console.log('   Summary');
console.log('═══════════════════════════════════════════════════\n');

if (anonValid && serviceValid) {
  console.log('✅ All Supabase keys are VALID');
  console.log('✅ You can now deploy to Vercel with these keys\n');
} else {
  console.log('❌ Some keys are INVALID or MISSING\n');
  console.log('📋 How to get the correct keys:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/xpgmbqwokgcbswrvygri/settings/api');
  console.log('   2. Copy the "anon public" key (starts with eyJhbGc...)');
  console.log('   3. Copy the "service_role" key (starts with eyJhbGc...)');
  console.log('   4. Update your .env file');
  console.log('   5. Update Vercel environment variables\n');
}

console.log('═══════════════════════════════════════════════════\n');
