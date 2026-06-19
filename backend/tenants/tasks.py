from celery import shared_task

from tenants.models import Company
from tenants.services import sync_company_external_database

from audit_logs.utils import create_audit_log


@shared_task
def scheduled_external_database_sync():

    results = []

    companies = Company.objects.filter(
        is_active=True,
        is_verified=True
    )

    for company in companies:

        try:

            create_audit_log(
                company=company,
                action="SYNC_STARTED",
                action_by=None,
                message="Scheduled external database sync started.",
                metadata={
                    "company": company.name,
                }
            )

            result = sync_company_external_database(
                company=company,
                action_by=None
            )

            results.append({
                "company": company.name,
                "success": result.get("success", False),
                "message": result.get("message"),
            })

        except Exception as e:

            create_audit_log(
                company=company,
                action="SYNC_FAILED",
                action_by=None,
                message="Scheduled external database sync failed.",
                metadata={
                    "error": str(e)
                }
            )

            results.append({
                "company": company.name,
                "success": False,
                "error": str(e)
            })

    return results