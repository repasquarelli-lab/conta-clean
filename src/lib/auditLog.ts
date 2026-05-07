import { supabase } from '@/integrations/supabase/client';

export type AuditEvent =
  | 'login'
  | 'logout'
  | 'password_changed'
  | 'password_reset_requested'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'mfa_backup_codes_generated'
  | 'mfa_backup_codes_used'
  | 'session_revoked'
  | 'data_exported'
  | 'account_deleted';

export async function logAuditEvent(
  event: AuditEvent,
  metadata: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      event_type: event,
      user_agent: navigator.userAgent,
      metadata: metadata as never,
    });
  } catch (e) {
    console.warn('audit log failed', e);
  }
}
