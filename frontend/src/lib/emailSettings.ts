import type {
  PlatformEmailServiceResponse,
  PlatformEmailServiceStatus,
  ReimbursementEmailConfigResponse,
} from '@/types'

export function unwrapReimbursementEmailConfig(
  response: ReimbursementEmailConfigResponse,
) {
  return response.data
}

export function unwrapEmailServiceStatus(
  response: PlatformEmailServiceResponse,
): PlatformEmailServiceStatus {
  if (response.email_service) {
    return response.email_service
  }

  const data = response.data ?? {}
  return {
    provider: data.smtp_source === 'PLATFORM_ENV' ? 'Platform SMTP (.env)' : data.smtp_source,
    outgoing_email: data.from_email,
    smtp_configured: Boolean(data.from_email),
    email_forwarding_required: true,
    platform_receipt_email: data.platform_receipt_email,
    ...data,
  }
}
