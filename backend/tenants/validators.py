from decimal import Decimal, InvalidOperation

from .models import Currency


SUPPORTED_POLICY_CATEGORIES = {
    "food",
    "hotel",
    "flight_ticket",
    "train_ticket",
    "car_rental",
    "taxi",
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
    Validate a currency code against the active Currency table.
    """

    if not currency_code:
        return False

    code = str(currency_code).strip().upper()

    if len(code) != 3:
        return False

    return Currency.objects.filter(
        code__iexact=code,
        is_active=True,
    ).exists()


def validate_amount(value):
    """
    Validate a non-negative decimal value.

    Missing values are invalid only when this function is called
    explicitly for a field that must contain an amount.
    """

    if value in [
        None,
        "",
        "null",
    ]:
        return False

    try:
        amount = Decimal(
            str(value)
            .replace(",", "")
            .strip()
        )

    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ):
        return False

    return amount >= Decimal("0")


def validate_category(category):
    """
    Validate a normalized policy category.
    """

    if not category:
        return False

    normalized = (
        str(category)
        .strip()
        .lower()
    )

    return normalized in SUPPORTED_POLICY_CATEGORIES


def validate_confidence(confidence):
    """
    Validate an optional confidence score between 0 and 1.
    """

    if confidence in [
        None,
        "",
    ]:
        return True

    try:
        value = float(confidence)

    except (
        TypeError,
        ValueError,
    ):
        return False

    return 0 <= value <= 1


def validate_policy_rule(
    rule,
    *,
    rule_index=None,
):
    """
    Validate one normalized policy rule.

    Non-monetary rules are allowed to have max_amount=None because
    they may represent approval, travel-class, documentation, or
    general policy statements. The importer will skip those rules
    instead of forcing them into PolicyCategoryRule.
    """

    errors = []

    prefix = (
        f"Rule {rule_index}: "
        if rule_index is not None
        else ""
    )

    if not isinstance(rule, dict):
        return [
            f"{prefix}Policy rule must be a JSON object."
        ]

    category = rule.get("category")

    if not category:
        errors.append(
            f"{prefix}category is required."
        )

    elif not validate_category(category):
        errors.append(
            f"{prefix}Invalid category '{category}'."
        )

    currency = rule.get("currency")

    if (
        currency
        and not validate_currency(currency)
    ):
        errors.append(
            f"{prefix}Unsupported currency '{currency}'."
        )

    is_allowed = bool(
        rule.get(
            "is_allowed",
            True,
        )
    )

    is_unlimited = bool(
        rule.get(
            "is_unlimited",
            False,
        )
    )

    max_amount = rule.get(
        "max_amount"
    )

    # Missing max_amount is allowed for non-monetary policy statements.
    # If Gemini supplied an amount, it must be valid.
    if max_amount not in [
        None,
        "",
        "null",
    ]:
        if not validate_amount(max_amount):
            errors.append(
                f"{prefix}Invalid max_amount."
            )

    # An unlimited policy should not carry a monetary maximum.
    if (
        is_unlimited
        and max_amount not in [
            None,
            "",
            "null",
        ]
    ):
        errors.append(
            f"{prefix}max_amount must be empty when is_unlimited is true."
        )

    # A prohibited rule may be stored later as amount 0.00.
    # Therefore, max_amount is not required here.
    if not is_allowed and is_unlimited:
        errors.append(
            f"{prefix}A prohibited rule cannot also be unlimited."
        )

    confidence = rule.get(
        "confidence"
    )

    if not validate_confidence(
        confidence
    ):
        errors.append(
            f"{prefix}confidence must be between 0 and 1."
        )

    translation_confidence = rule.get(
        "translation_confidence"
    )

    if not validate_confidence(
        translation_confidence
    ):
        errors.append(
            f"{prefix}translation_confidence must be between 0 and 1."
        )

    return errors


def validate_policy_json(policy_json):
    """
    Validate the normalized policy preview returned by
    policy_document_service.py.

    Expected root structure:

    {
        "document_language": "English",
        "policy_name": "Expense Policy",
        "policy_currency": "INR",
        "rules": [...]
    }
    """

    errors = []

    if not isinstance(
        policy_json,
        dict,
    ):
        return [
            "Policy preview must be a JSON object."
        ]

    rules = policy_json.get(
        "rules"
    )

    if rules is None:
        return [
            "rules missing."
        ]

    if not isinstance(
        rules,
        list,
    ):
        return [
            "rules must be a list."
        ]

    if not rules:
        return [
            "No policy rules were extracted."
        ]

    policy_currency = policy_json.get(
        "policy_currency"
    )

    if (
        policy_currency
        and not validate_currency(
            policy_currency
        )
    ):
        errors.append(
            f"Unsupported policy currency "
            f"'{policy_currency}'."
        )

    for index, rule in enumerate(
        rules,
        start=1,
    ):
        errors.extend(
            validate_policy_rule(
                rule,
                rule_index=index,
            )
        )

    return errorss