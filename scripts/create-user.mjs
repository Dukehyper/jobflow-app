/**
 * Creates a Supabase user without requiring email confirmation.
 * Run: node scripts/create-user.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SUPABASE_URL.includes('your_')) {
  console.error('❌ Supabase credentials not set in .env.local')
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL = 'aalokbista@gmail.com'
const PASSWORD = 'passorD@321'

const { data, error } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,   // skips email verification
  user_metadata: { full_name: 'Aalok Bista' },
})

if (error) {
  if (error.message.includes('already been registered')) {
    console.log('ℹ️  User already exists — you can log in at http://localhost:3000/login')
  } else {
    console.error('❌ Error:', error.message)
  }
  process.exit(0)
}

console.log('✅ User created successfully!')
console.log(`   Email:    ${EMAIL}`)
console.log(`   Password: ${PASSWORD}`)
console.log(`   ID:       ${data.user.id}`)
console.log('')
console.log('   → Go to http://localhost:3000/login and sign in.')
