import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  getGetUserQueryKey,
  getGetUserQueryOptions,
  getListUsersQueryKey,
  useGetUser,
  useUpdateUser,
} from "@/api/generated/users/users"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { isApiError } from "@/lib/api/api-error"
import { useBackToList } from "./-components/use-back-to-list"
import { UserForm } from "./-components/user-form"

export const Route = createFileRoute("/_app/users/$userId")({
  staticData: { breadcrumb: "users.form.editTitle" },
  // The form needs the user before it can render its default values, so this one waits.
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(getGetUserQueryOptions(params.userId))
    } catch (error) {
      if (isApiError(error) && error.status === 404) throw notFound()
      throw error
    }
  },
  notFoundComponent: UserNotFound,
  component: EditUserPage,
})

function EditUserPage() {
  const { t } = useTranslation()
  const { userId } = Route.useParams()
  const queryClient = useQueryClient()
  const backToList = useBackToList()
  // Already in the cache: the loader fetched it before this page rendered.
  const { data: user } = useGetUser(userId)
  const updateUser = useUpdateUser()

  if (!user) return null

  return (
    <>
      <PageHeader
        title={t("users.form.editTitle")}
        description={t("users.form.editDescription", { name: user.name })}
      />
      <UserForm
        // Remount when switching users so the defaults are taken again.
        key={user.id}
        defaultValues={{ name: user.name, email: user.email, role: user.role, status: user.status }}
        submitLabel={t("users.form.save")}
        onCancel={backToList}
        onSubmit={async (values) => {
          const updated = await updateUser.mutateAsync({ id: user.id, data: values })
          queryClient.setQueryData(getGetUserQueryKey(user.id), updated)
          await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })
          toast.success(t("users.form.saved"))
        }}
        onSaved={backToList}
      />
    </>
  )
}

function UserNotFound() {
  const { t } = useTranslation()
  return (
    <EmptyState
      title={t("errors.notFound")}
      description={t("users.form.notFound")}
      action={
        <Button asChild>
          <Link to="/users">{t("users.form.backToList")}</Link>
        </Button>
      }
    />
  )
}
