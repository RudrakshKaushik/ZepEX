from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import (
    Company,
    CompanyFinanceSettings,
    Currency,
)


@receiver(post_save, sender=Company)
def create_company_finance_settings(
    sender,
    instance,
    created,
    **kwargs
):
    if not created:
        return

    currency = Currency.objects.filter(
        code="INR"
    ).first()

    if currency:

        CompanyFinanceSettings.objects.get_or_create(
            company=instance,
            defaults={
                "base_currency": currency,
            }
        )