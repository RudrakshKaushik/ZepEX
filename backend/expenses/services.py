import base64
import json
import os
import re
from datetime import datetime
from decimal import Decimal

import requests
from django.utils import timezone

from .models import ExpenseLineItem, ExpenseReceipt
from django.conf import settings

def extract_receipt_with_gemini(receipt: ExpenseReceipt):
    receipt.status = "AI_PROCESSING"
    receipt.save(update_fields=["status"])

    prompt = """
You are an expert expense receipt analyzer.

Extract receipt data and return ONLY valid JSON.

Return format:
{
  "bills": [
    {
      "type": "",
      "amount": null,
      "currency": "",
      "bill_date": null,
      "vendor": "",
      "additional_info": ""
    }
  ]
}

Categories:
food, hotel, flight_ticket, train_ticket, car_rental,
fuel, gas, parking, office_supplies, medical, courier,
telecom, training, relocation, wfh, miscellaneous

Rules:
- vendor must be only merchant/company name.
- amount must be total payable amount.
- bill_date must be YYYY-MM-DD.
- if missing, use null or empty string.
"""

    try:
        receipt.receipt_file.open("rb")
        file_bytes = receipt.receipt_file.read()
        receipt.receipt_file.close()

        base64_data = base64.b64encode(file_bytes).decode("utf-8")

        file_name = receipt.receipt_file.name
        ext = file_name.split(".")[-1].lower()

        mime_map = {
            "pdf": "application/pdf",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
        }

        mime_type = mime_map.get(ext, "application/octet-stream")

        request_body = {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64_data,
                            }
                        },
                        {
                            "text": prompt
                        },
                    ]
                }
            ]
        }

        api_key = os.getenv("GEMINI_API_KEY")

        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": settings.GEMINI_API_KEY,
            },
            data=json.dumps(request_body),
            timeout=60,
        )

        response_json = response.json()

        if "error" in response_json:
            raise Exception(response_json["error"].get("message"))

        gemini_text = response_json["candidates"][0]["content"]["parts"][0]["text"]

        match = re.search(r"\{.*\}", gemini_text, re.DOTALL)

        if not match:
            raise Exception("No valid JSON returned by Gemini.")

        parsed_data = json.loads(match.group(0))

        bills = parsed_data.get("bills", [])

        created_items = []
        total_amount = Decimal("0.00")

        for bill in bills:
            amount = Decimal(str(bill.get("amount") or "0.00"))
            total_amount += amount

            try:
                bill_date = (
                    datetime.strptime(
                        bill.get("bill_date"),
                        "%Y-%m-%d"
                    ).date()
                    if bill.get("bill_date")
                    else None
                )
            except Exception:
                bill_date = None

            line_item = ExpenseLineItem.objects.create(
                receipt=receipt,
                description=bill.get("additional_info", "")[:500],
                category=bill.get("type", "miscellaneous"),
                vendor=bill.get("vendor", "")[:255],
                amount=amount,
                bill_date=bill_date,
            )

            created_items.append(line_item.id)

        first_bill = bills[0] if bills else {}

        receipt.vendor_name = first_bill.get("vendor", "")
        receipt.total_amount = total_amount
        receipt.currency = first_bill.get("currency") or "INR"

        if first_bill.get("bill_date"):
            try:
                receipt.invoice_date = datetime.strptime(
                    first_bill.get("bill_date"),
                    "%Y-%m-%d"
                ).date()
            except Exception:
                receipt.invoice_date = timezone.now().date()

        receipt.status = "AI_PROCESSED"
        receipt.save()

        return {
            "success": True,
            "receipt_id": str(receipt.id),
            "line_items_created": [str(item_id) for item_id in created_items],
            "total_amount": float(total_amount),
        }

    except Exception as e:
        receipt.status = "SUBMITTED"
        receipt.save(update_fields=["status"])

        return {
            "success": False,
            "error": str(e),
        }