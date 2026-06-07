from datetime import date

from .models import ExpenseReport


def get_or_create_current_month_report(profile):
    current_month = date.today().replace(day=1)

    report, created = ExpenseReport.objects.get_or_create(
        company=profile.company,
        employee=profile,
        department=profile.department,
        month=current_month,
        defaults={
            "status": ExpenseReport.STATUS_DRAFT
        }
    )

    return report