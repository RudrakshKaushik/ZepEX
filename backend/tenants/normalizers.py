from decimal import Decimal

from .models import Currency

CATEGORY_MAPPING = {

    "meal": "food",
    "restaurant": "food",
    "breakfast": "food",
    "lunch": "food",
    "dinner": "food",

    "airfare": "flight_ticket",
    "flight": "flight_ticket",

    "railway": "train_ticket",
    "train": "train_ticket",

    "petrol": "fuel",
    "diesel": "fuel",
    "gasoline": "fuel",

    "medicine": "medical",
    "pharmacy": "medical",

    "stationery": "office_supplies",

}


def normalize_category(category):

    if not category:

        return "miscellaneous"

    category = category.lower().strip()

    if category in CATEGORY_MAPPING:

        return CATEGORY_MAPPING[
            category
        ]

    return category


def normalize_currency(currency):

    if not currency:

        return ""

    currency = currency.upper().strip()

    if Currency.objects.filter(
        code=currency,
        is_active=True,
    ).exists():

        return currency

    return ""


def normalize_amount(amount):

    if amount in [
        None,
        "",
        "null",
    ]:

        return Decimal("0.00")

    try:

        return Decimal(str(amount))

    except Exception:

        return Decimal("0.00")


def normalize_vendor(vendor):

    if not vendor:

        return ""

    return " ".join(
        vendor.strip().split()
    )


def normalize_language(language):

    if not language:

        return "English"

    return language.title()


def normalize_text(text):

    if not text:

        return ""

    return " ".join(
        str(text).split()
    )


def normalize_bill(bill):

    bill["type"] = normalize_category(
        bill.get("type")
    )

    bill["currency"] = normalize_currency(
        bill.get("currency")
    )

    bill["amount"] = normalize_amount(
        bill.get("amount")
    )

    bill["vendor"] = normalize_vendor(
        bill.get("vendor")
    )

    bill["additional_info"] = normalize_text(
        bill.get(
            "additional_info"
        )
    )

    return bill


def normalize_policy_json(policy_json):

    policy_json["document_language"] = normalize_language(
        policy_json.get(
            "document_language"
        )
    )

    policy_json["document_summary"] = normalize_text(
        policy_json.get(
            "document_summary"
        )
    )

    bills = []

    for bill in policy_json.get(
        "bills",
        [],
    ):

        bills.append(
            normalize_bill(
                bill
            )
        )

    policy_json["bills"] = bills

    return policy_json