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
    edit_company_user,
    deactivate_company_user,
    activate_company_user,
    update_department,
    deactivate_department,
    activate_department,
    update_policy_rule,
    deactivate_policy_rule,
    activate_policy_rule,
    

    
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
path(
    "users/<int:user_id>/edit/",
    edit_company_user,
    name="edit-company-user"
),

path(
    "users/<int:user_id>/deactivate/",
    deactivate_company_user,
    name="deactivate-company-user"
),

path(
    "users/<int:user_id>/activate/",
    activate_company_user,
    name="activate-company-user"
),
path(
    "users/<uuid:user_id>/edit/",
    edit_company_user,
    name="edit-company-user"
),

path(
    "users/<uuid:user_id>/deactivate/",
    deactivate_company_user,
    name="deactivate-company-user"
),

path(
    "users/<uuid:user_id>/activate/",
    activate_company_user,
    name="activate-company-user"
),
path("departments/<uuid:department_id>/update/", update_department, name="update-department"),
path("departments/<uuid:department_id>/deactivate/", deactivate_department, name="deactivate-department"),
path("departments/<uuid:department_id>/activate/", activate_department, name="activate-department"),
path("policy/rules/<uuid:rule_id>/update/", update_policy_rule, name="update-policy-rule"),
path("policy/rules/<uuid:rule_id>/deactivate/", deactivate_policy_rule, name="deactivate-policy-rule"),
path("policy/rules/<uuid:rule_id>/activate/", activate_policy_rule, name="activate-policy-rule"),
]