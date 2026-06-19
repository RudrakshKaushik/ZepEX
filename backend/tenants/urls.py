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
]