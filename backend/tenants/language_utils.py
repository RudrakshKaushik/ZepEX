def get_company_output_language(company):
    preferences = getattr(
        company,
        "preferences",
        None,
    )

    if not preferences:
        return {
            "code": "en",
            "name": "English",
            "preserve_original_text": True,
        }

    return {
        "code": (
            preferences.output_language_code
            or "en"
        ),
        "name": (
            preferences.output_language_name
            or "English"
        ),
        "preserve_original_text": (
            preferences.preserve_original_text
        ),
    }