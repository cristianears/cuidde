#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '..')
const suites = {
  auth_profiles: {
    file: 'supabase/sql/db_impact_check_auth_profiles.sql',
    description: 'Signup, profiles, CPF, role rows and user consents',
  },
  subscriptions: {
    file: 'supabase/sql/db_impact_check_subscriptions.sql',
    description: 'Family billing grants, Stripe-owned fields and invoices',
  },
  appointments_chat: {
    file: 'supabase/sql/db_impact_check_appointments_chat.sql',
    description: 'Appointment participant RLS and chat message isolation',
  },
  caregiver_search: {
    file: 'supabase/sql/db_impact_check_caregiver_search.sql',
    description: 'Caregiver proximity search and gated public profile detail',
  },
  storage_documents: {
    file: 'supabase/sql/db_impact_check_storage_documents.sql',
    description: 'Caregiver document metadata and Storage object folder RLS',
  },
}

const aliases = {
  auth: 'auth_profiles',
  profiles: 'auth_profiles',
  billing: 'subscriptions',
  chat: 'appointments_chat',
  search: 'caregiver_search',
  documents: 'storage_documents',
}

const suiteNames = Object.keys(suites)
const args = process.argv.slice(2)
const command = args[0]
const requestedSuite = aliases[args[1] ?? ''] ?? args[1] ?? 'all'
const legacyPrint = args.includes('--print-sql')

const suitePath = (suiteName) => resolve(root, suites[suiteName].file)
const readSuite = (suiteName) => readFileSync(suitePath(suiteName), 'utf8')
const combinedSql = () => suiteNames
  .map((suiteName) => {
    const path = suitePath(suiteName)
    return [
      `-- ${basename(path)}`,
      readFileSync(path, 'utf8').trim(),
      '',
    ].join('\n')
  })
  .join('\n')

const assertKnownSuite = (suiteName) => {
  if (suiteName === 'all') return
  if (!suites[suiteName]) {
    console.error(`Unknown suite: ${suiteName}`)
    console.error(`Available suites: ${suiteNames.join(', ')}, all`)
    process.exit(1)
  }
}

if (legacyPrint || command === '--print') {
  const suiteName = legacyPrint ? 'all' : requestedSuite
  assertKnownSuite(suiteName)
  process.stdout.write(suiteName === 'all' ? combinedSql() : readSuite(suiteName))
  process.stdout.write('\n')
  process.exit(0)
}

if (command === '--list') {
  console.log('Database impact check suites')
  console.log('')
  for (const [name, suite] of Object.entries(suites)) {
    console.log(`- ${name}: ${suite.description}`)
    console.log(`  ${suite.file}`)
  }
  console.log('- all: prints every suite in execution order')
  process.exit(0)
}

console.log('Database impact check')
console.log('')
console.log('Available suites:')
for (const [name, suite] of Object.entries(suites)) {
  console.log(`- ${name}: ${suite.file}`)
}
console.log(`- all: supabase/sql/db_impact_check_all.sql manifest order`)
console.log('')
console.log('This project currently uses MCP Supabase for remote database access.')
console.log('npm scripts cannot call MCP tools directly, so run a suite by asking Codex to execute the printed SQL with:')
console.log('')
console.log('  mcp__mcp_supabase_ditti.execute_sql')
console.log('')
console.log('Useful commands:')
console.log('')
console.log('  npm run db:impact-check -- --list')
console.log('  npm run db:impact-check -- --print auth_profiles')
console.log('  npm run db:impact-check -- --print subscriptions')
console.log('  npm run db:impact-check -- --print appointments_chat')
console.log('  npm run db:impact-check -- --print caregiver_search')
console.log('  npm run db:impact-check -- --print storage_documents')
console.log('  npm run db:impact-check -- --print all')
console.log('')
console.log('Each suite is transactional and ends with rollback, so successful runs do not persist fixtures.')
