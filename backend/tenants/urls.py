from django.urls import path

from .views import (
    create_department,
    list_departments,
    create_employee,
    list_employees,
    assign_manager,
    get_database_config,
    save_database_config,
    create_company_policy,
    create_policy_rule,
    list_policy_rules,
    get_reimbursement_email_config,
    save_reimbursement_email_config,
    get_smtp_config,
    save_smtp_config,
)

urlpatterns = [

    path(
        "departments/",
        create_department,
        name="create-department"
    ),

    path(
        "departments/list/",
        list_departments,
        name="list-departments"
    ),
    path(
    "employees/",
    create_employee,
    name="create-employee"
),

path(
    "employees/list/",
    list_employees,
    name="list-employees"
),

path(
    "assign-manager/",
    assign_manager,
    name="assign-manager"
),

path(
    "database-config/",
    get_database_config,
    name="database-config"
),

path(
    "database-config/save/",
    save_database_config,
    name="save-database-config"
),
path(
    "policy/",
    create_company_policy,
    name="company-policy"
),

path(
    "policy/rules/create/",
    create_policy_rule,
    name="create-policy-rule"
),

path(
    "policy/rules/",
    list_policy_rules,
    name="list-policy-rules"
),
path(
    "reimbursement-email/",
    get_reimbursement_email_config,
    name="get-reimbursement-email-config"
),

path(
    "reimbursement-email/save/",
    save_reimbursement_email_config,
    name="save-reimbursement-email-config"
),
path("smtp-config/", get_smtp_config, name="get-smtp-config"),
path("smtp-config/save/", save_smtp_config, name="save-smtp-config"),
]