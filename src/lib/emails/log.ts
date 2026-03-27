import { createClient } from '@supabase/supabase-js'

export async function logEmail(workspaceId: string, emailType: string, recipient: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.from('email_log').insert({
      workspace_id: workspaceId,
      email_type: emailType,
      recipient,
    })
  } catch (err) {
    console.error('[email_log] Failed to log email:', err)
  }
}
