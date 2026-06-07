from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import (
    ExpenseSubmission,
    ExpenseReceipt,
    ExpenseLineItem,
    ApprovalHistory,
)


class ExpenseLineItemInline(admin.TabularInline):
    model = ExpenseLineItem
    extra = 0
    readonly_fields = ("created_at",)


class ApprovalHistoryInline(admin.TabularInline):
    model = ApprovalHistory
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(ExpenseSubmission)
class ExpenseSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "company", "employee", "source", "created_at")
    list_filter = ("source", "company")
    search_fields = ("employee__user__email", "company__name")


@admin.register(ExpenseReceipt)
class ExpenseReceiptAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "company",
        "employee",
        "department",
        "vendor_name",
        "total_amount",
        "currency",
        "status",
        "created_at",
    )
    list_filter = ("status", "company", "department")
    search_fields = ("vendor_name", "employee__user__email")
    inlines = [ExpenseLineItemInline, ApprovalHistoryInline]


@admin.register(ExpenseLineItem)
class ExpenseLineItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "receipt",
        "category",
        "vendor",
        "amount",
        "bill_date",
        "is_violating",
    )
    list_filter = ("category", "is_violating")
    search_fields = ("description", "vendor")


@admin.register(ApprovalHistory)
class ApprovalHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "receipt", "action_by", "action", "created_at")
    list_filter = ("action",)
    search_fields = ("receipt__id", "action_by__user__email")