import json
from pathlib import Path

from django.core.management.base import BaseCommand
from tenants.models import Currency


class Command(BaseCommand):
    help = "Seed currency master data."

    def handle(self, *args, **options):
        file_path = (
            Path(__file__).resolve().parents[2]
            / "seed_data"
            / "currencies.json"
        )

        if not file_path.exists():
            self.stderr.write(
                self.style.ERROR(f"File not found: {file_path}")
            )
            return

        with open(file_path, "r", encoding="utf-8") as file:
            currencies = json.load(file)

        created_count = 0
        updated_count = 0

        for currency in currencies:
            obj, created = Currency.objects.update_or_create(
                code=currency["code"].upper(),
                defaults={
                    "name": currency["name"],
                    "symbol": currency.get("symbol", ""),
                    "country": currency.get("country", ""),
                    "flag": currency.get("flag", ""),
                    "is_active": True,
                }
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Currencies seeded. Created: {created_count}, Updated: {updated_count}"
            )
        )