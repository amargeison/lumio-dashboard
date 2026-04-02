import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import * as fs from 'fs'
import * as path from 'path'

// ── Load .env.local ────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

// ── Config ─────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND_API_KEY = process.env.RESEND_API_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dev.lumiocms.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) resend = new Resend(RESEND_API_KEY)
  return resend
}

// ── Types ───────────────────────────────────────────────
interface SchoolRow {
  school_name: string
  slug: string
  admin_email: string
  admin_name: string
  city: string
  state: string
  district: string
  portal_type: 'telted' | 'neli'
  plan: string
}

interface ProvisionResult {
  slug: string
  school_name: string
  status: 'success' | 'skipped' | 'error'
  portal_url: string
  error?: string
}

// ── Parse CSV ───────────────────────────────────────────
function parseCSV(filePath: string): SchoolRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: any = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row as SchoolRow
  }).filter(row => row.school_name && row.slug && row.admin_email)
}

// ── Generate slug ───────────────────────────────────────
function makeSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ── Generate temp password ──────────────────────────────
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({length: 12}, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

// ── Provision one school ────────────────────────────────
async function provisionSchool(
  school: SchoolRow,
  results: ProvisionResult[],
  dryRun: boolean
): Promise<ProvisionResult> {

  const portalUrl = `${BASE_URL}/${school.portal_type}/${school.slug}`

  // Check if already exists
  const { data: existing } = await supabase
    .from('businesses')
    .select('id, slug')
    .eq('slug', school.slug)
    .single()

  if (existing) {
    console.log(`⏭  Skipping ${school.slug} — already exists`)
    return {
      slug: school.slug,
      school_name: school.school_name,
      status: 'skipped',
      portal_url: portalUrl
    }
  }

  if (dryRun) {
    console.log(`🔍 DRY RUN — would provision: ${school.school_name} (${school.slug})`)
    return {
      slug: school.slug,
      school_name: school.school_name,
      status: 'success',
      portal_url: portalUrl
    }
  }

  try {
    const tempPassword = generatePassword()

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: school.admin_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: school.admin_name,
        school_name: school.school_name,
        role: 'school_admin'
      }
    })

    if (authError) throw new Error(`Auth: ${authError.message}`)

    // 2. Insert business record
    const { error: bizError } = await supabase
      .from('businesses')
      .insert({
        slug: school.slug,
        company_name: school.school_name,
        owner_email: school.admin_email,
        owner_name: school.admin_name,
        plan: school.plan || 'enterprise',
        status: 'active',
        billing_type: 'enterprise',
        onboarded: true,
        onboarding_complete: true,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        welcome_email_sent: false,
        admin_notes: `Bulk provisioned ${new Date().toLocaleDateString()} — ${school.district} — ${school.city}, ${school.state} — Portal: ${school.portal_type}`,
      })

    if (bizError) throw new Error(`Business: ${bizError.message}`)

    // 3. Send welcome email
    const portalLabel = school.portal_type === 'telted' ? 'TEL TED' : 'NELI'

    const { error: emailError } = await getResend().emails.send({
      from: 'Lumio Schools <hello@lumiocms.com>',
      to: school.admin_email,
      subject: `Welcome to Lumio Schools — ${school.school_name} is ready`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #0C1A2E, #1B3060); padding: 40px 32px; text-align: center; }
            .header h1 { color: #C8960C; font-size: 28px; margin: 0 0 8px; font-family: Georgia, serif; }
            .header p { color: #8BA4C7; margin: 0; font-size: 14px; }
            .body { padding: 32px; }
            .body h2 { color: #1B3060; font-family: Georgia, serif; }
            .cta { display: block; background: #C8960C; color: white; text-decoration: none;
                   padding: 16px 32px; border-radius: 8px; text-align: center;
                   font-weight: 700; font-size: 16px; margin: 24px 0; }
            .credentials { background: #F0EDE5; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credentials p { margin: 4px 0; font-size: 14px; color: #374151; }
            .credentials strong { color: #1B3060; }
            .footer { background: #F9FAFB; padding: 20px 32px; text-align: center;
                      font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Lumio Schools</h1>
              <p>${portalLabel} Portal · ${school.district}</p>
            </div>
            <div class="body">
              <h2>Hi ${school.admin_name},</h2>
              <p>Your <strong>${portalLabel}</strong> portal for
                <strong>${school.school_name}</strong> is ready.
                You can log in now and start assessing students with
                LanguageScreen.</p>

              <a href="${portalUrl}" class="cta">
                Go to ${school.school_name} Portal →
              </a>

              <div class="credentials">
                <p><strong>Your portal:</strong> ${portalUrl}</p>
                <p><strong>Login email:</strong> ${school.admin_email}</p>
                <p><strong>Temporary password:</strong> ${tempPassword}</p>
                <p style="color: #B45309; margin-top: 12px; font-size: 13px;">
                  ⚠️ Please change your password after first login.
                </p>
              </div>

              <p>Your portal includes:</p>
              <ul>
                <li>LanguageScreen assessment tool</li>
                <li>${portalLabel} progress tracking</li>
                <li>Class and pupil profiles</li>
                <li>Insights and reports</li>
                <li>Training and resources</li>
              </ul>

              <p>If you need any help getting started, reply to this email
                or visit our support centre.</p>

              <p>Best wishes,<br>
              <strong>The Lumio Schools Team</strong></p>
            </div>
            <div class="footer">
              <p>Lumio Schools · lumiocms.com · hello@lumiocms.com</p>
              <p>Powered by OxEd & Assessment · University of Oxford</p>
              <p>● EEF 5/5 Evidence Rating</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (emailError) {
      console.warn(`⚠️  Email failed for ${school.slug}: ${emailError.message}`)
    } else {
      // Mark welcome email sent
      await supabase
        .from('businesses')
        .update({ welcome_email_sent: true })
        .eq('slug', school.slug)
    }

    console.log(`✅ Provisioned: ${school.school_name} → ${portalUrl}`)

    return {
      slug: school.slug,
      school_name: school.school_name,
      status: 'success',
      portal_url: portalUrl
    }

  } catch (err: any) {
    console.error(`❌ Failed: ${school.slug} — ${err.message}`)
    return {
      slug: school.slug,
      school_name: school.school_name,
      status: 'error',
      portal_url: portalUrl,
      error: err.message
    }
  }
}

// ── Generate report ─────────────────────────────────────
function generateReport(results: ProvisionResult[], csvPath: string) {
  const success = results.filter(r => r.status === 'success')
  const skipped = results.filter(r => r.status === 'skipped')
  const errors  = results.filter(r => r.status === 'error')

  const report = [
    '════════════════════════════════════════',
    'LUMIO SCHOOLS — PROVISIONING REPORT',
    `Run: ${new Date().toLocaleString()}`,
    '════════════════════════════════════════',
    `Total:   ${results.length}`,
    `Success: ${success.length}`,
    `Skipped: ${skipped.length} (already existed)`,
    `Errors:  ${errors.length}`,
    '',
    '── Provisioned Schools ─────────────────',
    ...success.map(r => `✅ ${r.school_name}\n   ${r.portal_url}`),
    '',
    errors.length > 0 ? '── Errors ──────────────────────────────' : '',
    ...errors.map(r => `❌ ${r.school_name}: ${r.error}`),
    '',
    '════════════════════════════════════════',
  ].join('\n')

  // Save report
  const reportPath = csvPath.replace('.csv', `-report-${Date.now()}.txt`)
  fs.writeFileSync(reportPath, report)

  console.log('\n' + report)
  console.log(`\nReport saved: ${reportPath}`)

  // Save portal URLs as CSV for distribution
  const urlsCsv = [
    'school_name,slug,admin_email,portal_url,status',
    ...results.map(r => {
      return `"${r.school_name}",${r.slug},,${r.portal_url},${r.status}`
    })
  ].join('\n')

  const urlsPath = csvPath.replace('.csv', `-urls-${Date.now()}.csv`)
  fs.writeFileSync(urlsPath, urlsCsv)
  console.log(`Portal URLs saved: ${urlsPath}`)
}

// ── Main ────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const csvPath = args[0] || 'scripts/schools-import.csv'
  const dryRun = args.includes('--dry-run')
  const batchSize = parseInt(args.find(a =>
    a.startsWith('--batch='))?.split('=')[1] || '10')

  console.log('🏫 Lumio Schools — Bulk Provisioning')
  console.log(`📋 CSV: ${csvPath}`)
  console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)
  console.log(`📦 Batch size: ${batchSize}`)
  console.log('')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`)
    process.exit(1)
  }

  const schools = parseCSV(csvPath)
  console.log(`Found ${schools.length} schools to provision\n`)

  if (!dryRun) {
    console.log('⚠️  LIVE MODE — this will create real accounts and send emails')
    console.log('Press Ctrl+C within 5 seconds to cancel...\n')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  const results: ProvisionResult[] = []

  // Process in batches to avoid overwhelming Supabase
  for (let i = 0; i < schools.length; i += batchSize) {
    const batch = schools.slice(i, i + batchSize)
    console.log(`\n── Batch ${Math.floor(i/batchSize)+1} (${i+1}–${Math.min(i+batchSize, schools.length)} of ${schools.length}) ──`)

    // Run batch in parallel
    const batchResults = await Promise.all(
      batch.map(school => provisionSchool(school, results, dryRun))
    )

    results.push(...batchResults)

    // Small delay between batches
    if (i + batchSize < schools.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  generateReport(results, csvPath)
}

main().catch(console.error)