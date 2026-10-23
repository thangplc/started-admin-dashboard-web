import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBlocker } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { UserRole, UserStatus } from "@/api/generated/model"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FormInput, FormSelect } from "@/components/common/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { applyServerErrors } from "@/lib/forms"

const FIELDS = ["name", "email", "role", "status"] as const

/** Same rules as `UserCreate` in openapi.yaml; messages follow the current language. */
function useUserSchema() {
  const { t } = useTranslation()
  return useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(2, t("validation.minLength", { count: 2 }))
          .max(100, t("validation.maxLength", { count: 100 })),
        email: z.email(t("validation.email")),
        role: z.enum(UserRole, t("validation.required")),
        status: z.enum(UserStatus, t("validation.required")),
      }),
    [t]
  )
}

export type UserFormValues = z.infer<ReturnType<typeof useUserSchema>>

type UserFormProps = {
  defaultValues: UserFormValues
  submitLabel: string
  /** Save the values. Throw (e.g. the ApiError from a mutation) to show the server's errors. */
  onSubmit: (values: UserFormValues) => Promise<void>
  /** Runs after a successful save, once the form is clean (navigate away here). */
  onSaved: () => void
  onCancel: () => void
}

/**
 * Create / edit form for a user. Recipe for any CRUD form:
 * zod validation, server 422 errors under their fields, and a "leave without saving?"
 * prompt when navigating away (or closing the tab) with unsaved changes.
 */
export function UserForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onSaved,
  onCancel,
}: UserFormProps) {
  const { t } = useTranslation()
  const schema = useUserSchema()
  const form = useForm<UserFormValues>({ resolver: zodResolver(schema), defaultValues })
  // Reading isDirty here also subscribes to it: react-hook-form only tracks the parts of
  // formState that are read during render.
  const { isDirty, isSubmitting, errors } = form.formState

  // The check reads `form.formState.isDirty` when it runs (not the value captured at render),
  // so the reset() after a successful save is already visible when onSaved() navigates away.
  const blocker = useBlocker({
    shouldBlockFn: () => form.formState.isDirty,
    enableBeforeUnload: () => form.formState.isDirty,
    withResolver: true,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      applyServerErrors(error, form.setError, FIELDS)
      return
    }
    form.reset(values)
    onSaved()
  })

  const roleOptions = Object.values(UserRole).map((role) => ({
    value: role,
    label: t(`users.role.${role}`),
  }))
  const statusOptions = Object.values(UserStatus).map((status) => ({
    value: status,
    label: t(`users.status.${status}`),
  }))

  return (
    <>
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} noValidate>
          <CardContent>
            <FieldGroup>
              {errors.root?.server && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {errors.root.server.message}
                </p>
              )}
              <FormInput
                control={form.control}
                name="name"
                label={t("users.form.name")}
                autoComplete="off"
                autoFocus
              />
              <FormInput
                control={form.control}
                name="email"
                label={t("users.form.email")}
                type="email"
                autoComplete="off"
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <FormSelect
                  control={form.control}
                  name="role"
                  label={t("users.form.role")}
                  options={roleOptions}
                />
                <FormSelect
                  control={form.control}
                  name="status"
                  label={t("users.form.status")}
                  options={statusOptions}
                />
              </div>
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-6 justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {submitLabel}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <ConfirmDialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title={t("users.form.leaveTitle")}
        description={t("users.form.leaveDescription")}
        confirmText={t("users.form.leave")}
        cancelText={t("users.form.stay")}
        variant="destructive"
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  )
}
