from django.urls import path

from .views import (
    create_department,
    list_departments,
    create_employee,
    list_employees,
    assign_missing_company_roles_view,
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
    delete_company_user,
    delete_department,
    create_company_role,
    company_roles,
    update_company_role,
    deactivate_company_role,
    test_database_connection,
    sync_external_database,
    database_sync_status,
    database_sync_logs,
    database_sync_dashboard,
    import_departments,
    import_company_roles,
    import_employees,
    import_policy_rules,
    download_department_template,
    download_roles_template,
    download_employees_template,
    download_policy_rules_template,
    department_template_info,
    roles_template_info,
    employees_template_info,
    policy_rules_template_info,
    send_employee_invites,


)

urlpatterns = [
    path("departments/", create_department, name="create-department"),
    path("departments/list/", list_departments, name="list-departments"),
    path("departments/<uuid:department_id>/update/", update_department, name="update-department"),
    path("departments/<uuid:department_id>/deactivate/", deactivate_department, name="deactivate-department"),
    path("departments/<uuid:department_id>/activate/", activate_department, name="activate-department"),
    path("departments/<uuid:department_id>/delete/", delete_department, name="delete-department"),

    path("employees/", create_employee, name="create-employee"),
    path("employees/list/", list_employees, name="list-employees"),
    path(
        "employees/assign-missing-roles/",
        assign_missing_company_roles_view,
        name="assign-missing-company-roles",
    ),

    path("users/<int:user_id>/edit/", edit_company_user, name="edit-company-user"),
    path("users/<int:user_id>/deactivate/", deactivate_company_user, name="deactivate-company-user"),
    path("users/<int:user_id>/activate/", activate_company_user, name="activate-company-user"),
    path("users/<int:user_id>/delete/", delete_company_user, name="delete-company-user"),

    path("assign-manager/", assign_manager, name="assign-manager"),

    path("roles/create/", create_company_role, name="create-company-role"),
    path("roles/", company_roles, name="company-roles"),
    path("roles/<int:role_id>/update/", update_company_role, name="update-company-role"),
    path("roles/<int:role_id>/deactivate/", deactivate_company_role, name="deactivate-company-role"),

    path("database-config/", get_database_config, name="database-config"),
    path("database-config/save/", save_database_config, name="save-database-config"),
    path("database/test-connection/", test_database_connection, name="test-database-connection"),
    path("database/sync/", sync_external_database, name="sync-external-database"),
    path("database/status/", database_sync_status, name="database-sync-status"),

    path("policy/", create_company_policy, name="company-policy"),
    path("policy/rules/create/", create_policy_rule, name="create-policy-rule"),
    path("policy/rules/", list_policy_rules, name="list-policy-rules"),
    path("policy/rules/<uuid:rule_id>/update/", update_policy_rule, name="update-policy-rule"),
    path("policy/rules/<uuid:rule_id>/deactivate/", deactivate_policy_rule, name="deactivate-policy-rule"),
    path("policy/rules/<uuid:rule_id>/activate/", activate_policy_rule, name="activate-policy-rule"),

    path("reimbursement-email/", get_reimbursement_email_config, name="get-reimbursement-email-config"),
    path("reimbursement-email/save/", save_reimbursement_email_config, name="save-reimbursement-email-config"),

    path("smtp-config/", get_smtp_config, name="get-smtp-config"),
    path("smtp-config/save/", save_smtp_config, name="save-smtp-config"),
    path("database/sync-logs/",database_sync_logs,name="database-sync-logs"),
    path(
    "database/sync-dashboard/",
    database_sync_dashboard,
    name="database-sync-dashboard"
),
path(
    "departments/import/",
    import_departments,
    name="import-departments"
),
path(
    "roles/import/",
    import_company_roles,
    name="import-company-roles"
),
path(
    "employees/import/",
    import_employees,
    name="import-employees"
),
path(
    "policy-rules/import/",
    import_policy_rules,
    name="import-policy-rules"
),
path("departments/template/", download_department_template, name="department-template"),
path("roles/template/", download_roles_template, name="roles-template"),
path("employees/template/", download_employees_template, name="employees-template"),
path("policy-rules/template/", download_policy_rules_template, name="policy-rules-template"),
path("departments/template/", department_template_info, name="department-template-info"),
path("departments/template/download/", download_department_template, name="department-template-download"),

path("roles/template/", roles_template_info, name="roles-template-info"),
path("roles/template/download/", download_roles_template, name="roles-template-download"),

path("employees/template/", employees_template_info, name="employees-template-info"),
path("employees/template/download/", download_employees_template, name="employees-template-download"),

path("policy-rules/template/", policy_rules_template_info, name="policy-rules-template-info"),
path("policy-rules/template/download/", download_policy_rules_template, name="policy-rules-template-download"),
path(
    "employees/send-invites/",
    send_employee_invites,
    name="send-employee-invites"
),
]