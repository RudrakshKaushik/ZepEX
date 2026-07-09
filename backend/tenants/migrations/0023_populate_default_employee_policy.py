from django.db import migrations


def populate_employee_role(apps, schema_editor):
    CompanyPolicy = apps.get_model("tenants", "CompanyPolicy")
    CompanyRole = apps.get_model("tenants", "CompanyRole")
    PolicyCategoryRule = apps.get_model("tenants", "PolicyCategoryRule")

    for policy in CompanyPolicy.objects.all():

        employee_role = CompanyRole.objects.filter(
            company=policy.company,
            name__iexact="Employee"
        ).first()

        if employee_role:
            PolicyCategoryRule.objects.filter(
                policy=policy,
                company_role__isnull=True
            ).update(
                company_role=employee_role
            )


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0022_alter_policycategoryrule_unique_together_and_more"),
    ]

    operations = [
        migrations.RunPython(populate_employee_role),
    ]