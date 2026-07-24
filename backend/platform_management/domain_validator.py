from email_validator import validate_email
from email_validator import EmailNotValidError


def validate_company_email_domain(email):
    """
    Validate whether the email domain exists.
    Returns (True, None) if valid.
    Returns (False, error_message) otherwise.
    """

    try:
        validate_email(
            email,
            check_deliverability=True,
        )

        return True, None

    except EmailNotValidError as exc:
        return False, str(exc)