from decimal import Decimal

import requests
from django.conf import settings
from django.utils import timezone


def convert_currency(
    amount,
    from_currency,
    to_currency,
):
    amount = Decimal(str(amount or 0))
    from_currency = str(from_currency or "INR").upper()
    to_currency = str(to_currency or "INR").upper()

    print("=" * 60)
    print("convert_currency() CALLED")
    print("FROM :", from_currency)
    print("TO   :", to_currency)
    print("AMOUNT :", amount)
    print("API KEY :", settings.EXCHANGE_RATE_API_KEY)
    print("API URL :", settings.EXCHANGE_RATE_API_URL)
    print("=" * 60)

    if from_currency == to_currency:
        print("Same currency. No conversion required.")
        return {
            "success": True,
            "company_amount": amount.quantize(Decimal("0.01")),
            "company_currency": to_currency,
            "exchange_rate": Decimal("1"),
            "exchange_rate_date": timezone.now(),
            "exchange_rate_provider": "Same Currency",
        }

    try:
        url = (
            f"{settings.EXCHANGE_RATE_API_URL}/"
            f"{settings.EXCHANGE_RATE_API_KEY}/latest/{from_currency}"
        )

        print("REQUEST URL:", url)

        response = requests.get(
            url,
            timeout=10,
        )

        print("STATUS CODE:", response.status_code)

        print("STATUS CODE:", response.status_code)
        print("RAW RESPONSE:", response.text[:500])

        data = response.json()

        print("API RESPONSE:")
        print(data)

        if data.get("result") != "success":
            return {
                "success": False,
                "error": data.get(
                    "error-type",
                    "Unable to fetch exchange rate."
                ),
            }

        rates = data.get("conversion_rates", {})

        if to_currency not in rates:
            return {
                "success": False,
                "error": f"{to_currency} not found in conversion rates."
            }

        rate = Decimal(str(rates[to_currency]))

        converted_amount = amount * rate

        print("RATE :", rate)
        print("CONVERTED :", converted_amount)

        return {
            "success": True,
            "company_amount": converted_amount.quantize(
                Decimal("0.01")
            ),
            "company_currency": to_currency,
            "exchange_rate": rate,
            "exchange_rate_date": timezone.now(),
            "exchange_rate_provider": settings.EXCHANGE_RATE_PROVIDER,
        }

    except Exception as e:
        print("EXCEPTION:", str(e))
        return {
            "success": False,
            "error": str(e),
        }