from decimal import Decimal, InvalidOperation

from .models import Currency

SUPPORTED_CATEGORIES = {
    "food",
    "hotel",
    "flight_ticket",
    "train_ticket",
    "car_rental",
    "fuel",
    "gas",
    "parking",
    "office_supplies",
    "medical",
    "courier",
    "telecom",
    "training",
    "relocation",
    "wfh",
    "miscellaneous",
}


def validate_currency(currency_code):
    """
    Validate ISO currency.
    """

    if not currency_code:
        return False

    return Currency.objects.filter(
        code=currency_code.upper(),
        is_active=True,
    ).exists()


def validate_amount(value):
    """
    Validate decimal amount.
    """

    if value in [None, "", "null"]:
        return False

    try:
        amount = Decimal(str(value))

        return amount >= 0

    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ):
        return False


def validate_category(category):

    if not category:
        return False

    return category.lower() in SUPPORTED_CATEGORIES


def validate_confidence(confidence):

    try:

        value = float(confidence)

        return 0 <= value <= 1

    except Exception:

        return False


def validate_document_json(data):
    """
    Validate root JSON returned by Gemini.
    """

    required = [
        "document_language",
        "document_language_code",
        "document_summary",
        "bills",
    ]

    errors = []

    for field in required:

        if field not in data:

            errors.append(f"{field} missing.")

    if "bills" in data:

        if not isinstance(data["bills"], list):

            errors.append("bills must be list.")

    return errors


def validate_bill_json(bill):

    errors = []

    required = [
        "type",
        "amount",
        "currency",
        "vendor",
    ]

    for field in required:

        if field not in bill:

            errors.append(
                f"{field} missing."
            )

    if not validate_category(
        bill.get("type")
    ):

        errors.append(
            "Invalid category."
        )

    if not validate_currency(
        bill.get("currency")
    ):

        errors.append(
            "Invalid currency."
        )

    if not validate_amount(
        bill.get("amount")
    ):

        errors.append(
            "Invalid amount."
        )

    confidence = bill.get(
        "confidence",
        {},
    )

    if confidence:

        for key, value in confidence.items():

            if not validate_confidence(value):

                errors.append(
                    f"Invalid confidence '{key}'."
                )

    return errors


def validate_policy_json(policy_json):
    """
    Validate complete AI response.
    """

    errors = []

    errors.extend(
        validate_document_json(
            policy_json
        )
    )

    for bill in policy_json.get(
        "bills",
        [],
    ):

        errors.extend(
            validate_bill_json(
                bill
            )
        )

    return errors