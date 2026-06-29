import base64
import json
import re
from datetime import datetime, timedelta
from decimal import Decimal

import requests
from django.conf import settings
from django.utils import timezone

from tenants.models import CompanyPolicy, PolicyCategoryRule
from .models import (
    ExpenseLineItem,
    ExpenseReceipt,
    DuplicateReceiptLog,
)

from .policy_services import validate_receipt_policy



OLD_BILL_LIMIT_DAYS = 90

def check_policy_violations(receipt):

    violation_reasons = []

    receipt.has_duplicate_violation = False
    receipt.has_old_bill_violation = False
    receipt.has_amount_violation = False
    receipt.has_any_violation = False
    receipt.policy_violation_reason = ""

    # =====================================================
    # 1. Duplicate Receipt Validation
    # =====================================================

    if receipt.vendor_name and receipt.invoice_date and receipt.original_amount:

        same_employee_duplicate = ExpenseReceipt.objects.filter(
            company=receipt.company,
            employee=receipt.employee,
            vendor_name__iexact=receipt.vendor_name,
            invoice_date=receipt.invoice_date,
            original_amount=receipt.original_amount,
        ).exclude(
            id=receipt.id
        ).order_by(
            "created_at"
        ).first()

        if same_employee_duplicate:

            receipt.has_duplicate_violation = True

            violation_reasons.append(
                "Duplicate receipt detected. Same employee, vendor, amount and bill date already exist."
            )

            DuplicateReceiptLog.objects.get_or_create(
                original_receipt=same_employee_duplicate,
                duplicate_receipt=receipt,
                defaults={
                    "duplicate_type": DuplicateReceiptLog.DUPLICATE_SAME_EMPLOYEE
                }
            )

        cross_employee_duplicate = ExpenseReceipt.objects.filter(
            company=receipt.company,
            vendor_name__iexact=receipt.vendor_name,
            invoice_date=receipt.invoice_date,
            original_amount=receipt.original_amount,
        ).exclude(
            employee=receipt.employee
        ).exclude(
            id=receipt.id
        ).order_by(
            "created_at"
        ).first()

        if cross_employee_duplicate:

            receipt.has_duplicate_violation = True

            violation_reasons.append(
                "Possible cross-employee duplicate detected."
            )

            DuplicateReceiptLog.objects.get_or_create(
                original_receipt=cross_employee_duplicate,
                duplicate_receipt=receipt,
                defaults={
                    "duplicate_type": DuplicateReceiptLog.DUPLICATE_CROSS_EMPLOYEE
                }
            )

    # =====================================================
    # 2. Old Bill Validation
    # =====================================================

    if receipt.invoice_date:

        limit_date = (
            timezone.now().date()
            - timedelta(days=OLD_BILL_LIMIT_DAYS)
        )

        if receipt.invoice_date < limit_date:

            receipt.has_old_bill_violation = True

            violation_reasons.append(
                f"Receipt is older than {OLD_BILL_LIMIT_DAYS} days."
            )

    # =====================================================
    # 3. Company Policy Validation
    # (Already compares company_amount in company currency)
    # =====================================================

    policy_result = validate_receipt_policy(receipt)

    receipt.has_amount_violation = policy_result["has_violations"]

    if policy_result["violations"]:
        violation_reasons.extend(
            policy_result["violations"]
        )

    # =====================================================
    # Final Result
    # =====================================================

    receipt.has_any_violation = any([
        receipt.has_duplicate_violation,
        receipt.has_old_bill_violation,
        receipt.has_amount_violation,
    ])

    receipt.policy_violation_reason = "\n".join(
        violation_reasons
    )

    if receipt.has_any_violation:
        receipt.status = ExpenseReceipt.STATUS_POLICY_VIOLATION
    else:
        receipt.status = ExpenseReceipt.STATUS_VALID

    receipt.save(update_fields=[
        "has_duplicate_violation",
        "has_old_bill_violation",
        "has_amount_violation",
        "has_any_violation",
        "policy_violation_reason",
        "status",
        "updated_at",
    ])

from .currency_services import convert_currency


def extract_receipt_with_gemini(receipt: ExpenseReceipt):

    receipt.status = ExpenseReceipt.STATUS_AI_PROCESSING
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
- currency must be a 3-letter ISO code like INR, USD, EUR, GBP.
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

        mime_type = mime_map.get(ext)

        if not mime_type:
            raise Exception(
                "Unsupported file type. Please upload PDF, JPG, JPEG, or PNG."
            )

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
                        {"text": prompt},
                    ]
                }
            ]
        }

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

        extracted_currency = (
            first_bill.get("currency") or "INR"
        ).upper()

        finance_settings = receipt.company.finance_settings

        company_currency = (
            finance_settings.base_currency.code
            if finance_settings and finance_settings.base_currency
            else "INR"
        ).upper()

        receipt.vendor_name = first_bill.get("vendor", "")

        receipt.original_amount = total_amount
        receipt.original_currency = extracted_currency

        receipt.currency = extracted_currency

        if first_bill.get("bill_date"):
            try:
                receipt.invoice_date = datetime.strptime(
                    first_bill.get("bill_date"),
                    "%Y-%m-%d"
                ).date()
            except Exception:
                receipt.invoice_date = timezone.now().date()

        conversion_result = None

        if finance_settings.auto_currency_conversion:
            conversion_result = convert_currency(
                amount=receipt.original_amount,
                from_currency=receipt.original_currency,
                to_currency=company_currency,
            )

            if conversion_result.get("success"):
                receipt.company_amount = conversion_result["company_amount"]
                receipt.company_currency = conversion_result["company_currency"]
                receipt.exchange_rate = conversion_result["exchange_rate"]
                receipt.exchange_rate_date = conversion_result["exchange_rate_date"]
                receipt.exchange_rate_provider = conversion_result[
                    "exchange_rate_provider"
                ]
            else:
                receipt.company_amount = receipt.original_amount
                receipt.company_currency = receipt.original_currency
                receipt.exchange_rate = None
                receipt.exchange_rate_date = None
                receipt.exchange_rate_provider = None

        else:
            receipt.company_amount = receipt.original_amount
            receipt.company_currency = receipt.original_currency
            receipt.exchange_rate = Decimal("1")
            receipt.exchange_rate_date = timezone.now()
            receipt.exchange_rate_provider = "Conversion Disabled"

        receipt.total_amount = receipt.company_amount
        receipt.status = ExpenseReceipt.STATUS_AI_PROCESSED
        receipt.save()

        check_policy_violations(receipt)

        receipt.refresh_from_db()

        if receipt.report:
            report = receipt.report
            report.total_amount = sum(
                r.company_amount for r in report.receipts.all()
            )
            report.save(update_fields=["total_amount", "updated_at"])

        return {
            "success": True,
            "receipt_id": str(receipt.id),
            "line_items_created": [str(item_id) for item_id in created_items],

            "original_amount": str(receipt.original_amount),
            "original_currency": receipt.original_currency,

            "company_amount": str(receipt.company_amount),
            "company_currency": receipt.company_currency,

            "exchange_rate": (
                str(receipt.exchange_rate)
                if receipt.exchange_rate is not None else None
            ),
            "exchange_rate_date": (
                receipt.exchange_rate_date.isoformat()
                if receipt.exchange_rate_date else None
            ),
            "exchange_rate_provider": receipt.exchange_rate_provider,

            "currency_conversion": conversion_result,

            "has_any_violation": receipt.has_any_violation,
            "violation_reason": receipt.policy_violation_reason,
        }

    except Exception as e:
        receipt.status = ExpenseReceipt.STATUS_AI_PROCESSED
        receipt.policy_violation_reason = f"AI extraction failed: {str(e)}"
        receipt.save(update_fields=[
            "status",
            "policy_violation_reason",
            "updated_at"
        ])

        return {
            "success": False,
            "error": str(e),
        }