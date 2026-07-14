from django.conf import settings
import requests
import json


def generate_content(model, request_body, timeout=60):
    response = requests.post(
        f"{settings.GEMINI_API_URL}/{model}:generateContent",
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": settings.GEMINI_API_KEY,
        },
        data=json.dumps(request_body),
        timeout=timeout,
    )

    response.raise_for_status()
    return response.json()