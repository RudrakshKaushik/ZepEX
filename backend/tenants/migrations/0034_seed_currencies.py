import json
from pathlib import Path

from django.db import migrations


def seed_currencies(apps, schema_editor):
    Currency = apps.get_model("tenants", "Currency")
    file_path = Path(__file__).resolve().parents[1] / "seed_data" / "currencies.json"

    if not file_path.exists():
        return

    with open(file_path, "r", encoding="utf-8") as file:
        currencies = json.load(file)

    for currency in currencies:
        Currency.objects.update_or_create(
            code=currency["code"].upper(),
            defaults={
                "name": currency["name"],
                "symbol": currency.get("symbol", ""),
                "country": currency.get("country", ""),
                "flag": currency.get("flag", ""),
                "is_active": True,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0033_alter_policycategoryrule_options_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_currencies, migrations.RunPython.noop),
    ]
