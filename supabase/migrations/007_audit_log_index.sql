-- ============================================================================
-- MIGRATION: 007_audit_log_index.sql
-- FOSS Maveli Hunt - Audit Log Performance Index
-- ============================================================================

create index if not exists idx_audit_log_action_at on public.audit_log (action, at desc);
