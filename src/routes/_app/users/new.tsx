import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getListUsersQueryKey, useCreateUser } from "@/api/generated/users/users"
import { PageHeader } from "@/components/common/page-header"
import { useBackToList } from "./-components/use-back-to-list"
import { UserForm } from "./-components/user-form"

export const Route = createFileRoute("/_app/users/new")({
  staticData: { breadcrumb: "users.form.createTitle" },
  component: NewUserPage,
})

function NewUserPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const backToList = useBackToList()
  const createUser = useCreateUser()

  return (
    <>
      <PageHeader
        title={t("users.form.createTitle")}
        description={t("users.form.createDescription")}
      />
      <UserForm
        defaultValues={{ name: "", email: "", role: "viewer", status: "invited" }}
        submitLabel={t("users.form.create")}
        onCancel={backToList}
        onSubmit={async (values) => {
          const user = await createUser.mutateAsync({ data: values })
          await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })
          toast.success(t("users.form.created", { name: user.name }))
        }}
        onSaved={backToList}
      />
    </>
  )
}
