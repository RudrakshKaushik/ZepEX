from django.urls import path

from .views import (
    upload_receipt,
    email_ingest_receipt,
    submit_current_month_report,
    manager_pending_reports,
    manager_approve_report,
    manager_reject_report,
    current_month_report,
    accounts_pending_reports,
    accounts_reject_report,
    accounts_approve_report,
    accounts_mark_paid,
    delete_expense_line_item,
    trigger_reimbursement_email_fetch,
    my_uploaded_expenses,
    admin_employee_expenses,
)

urlpatterns = [
    path("upload/", upload_receipt, name="upload-receipt"),
    path("email-ingest/", email_ingest_receipt, name="email-ingest-receipt"),
    path("reports/submit/", submit_current_month_report, name="submit-current-month-report"),
    path("manager/reports/pending/", manager_pending_reports, name="manager-pending-reports"),
    path("manager/reports/<uuid:report_id>/approve/",manager_approve_report,name="manager-approve-report"),
    path("manager/reports/<uuid:report_id>/reject/",manager_reject_report,name="manager-reject-report"),
    path("reports/current/",current_month_report,name="current-month-report"),
    path("accounts/reports/pending/", accounts_pending_reports, name="accounts-pending-reports"),
    path("accounts/reports/<uuid:report_id>/approve/", accounts_approve_report, name="accounts-approve-report"),
    path("accounts/reports/<uuid:report_id>/reject/", accounts_reject_report, name="accounts-reject-report"),
    path("accounts/reports/<uuid:report_id>/paid/", accounts_mark_paid, name="accounts-mark-paid"),
    path("line-items/<uuid:line_item_id>/delete/",delete_expense_line_item,name="delete-expense-line-item"),
    path("emails/fetch/",trigger_reimbursement_email_fetch,name="trigger-reimbursement-email-fetch"),
    path("my-uploaded-expenses/",my_uploaded_expenses,name="my-uploaded-expenses"),
    path("admin/employee/<uuid:employee_id>/expenses/",admin_employee_expenses,name="admin-employee-expenses"),
    

]