from expenses.models import ApprovalWorkflowStep


def validate_workflow(workflow):
    """
    Validate a workflow before it can be used.

    Returns:
        (True, None)

    or

        (False, "reason")
    """

    steps = list(
        workflow.steps.filter(
            is_active=True
        ).select_related(
            "approver_role",
            "specific_user",
            "specific_user__user",
            "department",
        ).order_by("step_order")
    )

    # ------------------------------------
    # At least one step
    # ------------------------------------

    if not steps:
        return False, "Workflow must contain at least one step."

    # ------------------------------------
    # Maximum 50 steps
    # ------------------------------------

    if len(steps) > 50:
        return False, "Workflow cannot contain more than 50 steps."

    # ------------------------------------
    # Start role must be active
    # ------------------------------------

    if (
        workflow.start_role
        and not workflow.start_role.is_active
    ):
        return False, "Workflow start role is inactive."

    previous_order = 0

    used_orders = set()
    used_role_steps = set()
    used_specific_users = set()

    # ------------------------------------
    # Validate every step
    # ------------------------------------

    for step in steps:

        # ----------------------------
        # Continuous ordering
        # ----------------------------

        if step.step_order != previous_order + 1:
            return (
                False,
                "Workflow step order must be continuous."
            )

        previous_order = step.step_order

        # ----------------------------
        # Duplicate order
        # ----------------------------

        if step.step_order in used_orders:
            return (
                False,
                f"Duplicate step order {step.step_order}."
            )

        used_orders.add(step.step_order)

        # ----------------------------
        # Company Role
        # ----------------------------

        if (
            step.approver_type
            == ApprovalWorkflowStep.APPROVER_COMPANY_ROLE
        ):

            if not step.approver_role:
                return (
                    False,
                    f"Step {step.step_order}: Company role is missing."
                )

            if not step.approver_role.is_active:
                return (
                    False,
                    f"Step {step.step_order}: Company role is inactive."
                )

            key = (
                step.approver_role.id,
                step.routing_type,
                step.department_id,
            )

            if key in used_role_steps:
                return (
                    False,
                    f"Duplicate company role '{step.approver_role.name}'."
                )

            used_role_steps.add(key)

        # ----------------------------
        # Specific User
        # ----------------------------

        elif (
            step.approver_type
            == ApprovalWorkflowStep.APPROVER_SPECIFIC_USER
        ):

            if not step.specific_user:
                return (
                    False,
                    f"Step {step.step_order}: Specific user missing."
                )

            if not step.specific_user.user.is_active:
                return (
                    False,
                    f"Step {step.step_order}: Specific user inactive."
                )

            if (
                step.specific_user.company
                != workflow.company
            ):
                return (
                    False,
                    f"Step {step.step_order}: User belongs to another company."
                )

            if step.specific_user.id in used_specific_users:
                return (
                    False,
                    "Same specific user cannot approve twice."
                )

            used_specific_users.add(
                step.specific_user.id
            )

        # ----------------------------
        # Department validation
        # ----------------------------

        if step.department:

            if step.department.company != workflow.company:

                return (
                    False,
                    f"Step {step.step_order}: Department belongs to another company."
                )

            if not step.department.is_active:

                return (
                    False,
                    f"Step {step.step_order}: Department inactive."
                )

    return True, None