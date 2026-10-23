import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { BoxIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { FormInput } from "@/components/common/form"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { env } from "@/config/env"
import { siteConfig } from "@/config/site"
import { isApiError } from "@/lib/api/api-error"
import { hasSession, safeRedirect, signIn } from "@/lib/auth/auth"
import { applyServerErrors } from "@/lib/forms"
import { DEMO_ACCOUNT } from "@/mocks/demo-account"

const searchSchema = z.object({
  /** Where to go after signing in (set by the auth guard). */
  redirect: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (hasSession()) throw redirect({ href: safeRedirect(search.redirect) })
  },
  component: LoginPage,
})

const FIELDS = ["email", "password"] as const

function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { redirect: redirectTo } = Route.useSearch()

  // Built inside the component so messages follow the current language.
  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("validation.email")),
        password: z.string().min(6, t("validation.minLength", { count: 6 })),
      }),
    [t]
  )
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn(values)
      await router.navigate({ href: safeRedirect(redirectTo), replace: true })
    } catch (error) {
      if (isApiError(error) && error.isUnauthorized) {
        form.setError("root.server", { message: t("auth.login.invalidCredentials") })
      } else {
        applyServerErrors(error, form.setError, FIELDS)
      }
    }
  })

  const serverError = form.formState.errors.root?.server?.message

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BoxIcon className="size-5" />
          </div>
          <CardTitle className="text-xl">{t("auth.login.title")}</CardTitle>
          <CardDescription>
            {siteConfig.name} · {t("auth.login.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              {serverError && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {serverError}
                </p>
              )}
              <FormInput
                control={form.control}
                name="email"
                label={t("auth.login.email")}
                type="email"
                autoComplete="email"
                autoFocus
              />
              <FormInput
                control={form.control}
                name="password"
                label={t("auth.login.password")}
                type="password"
                autoComplete="current-password"
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Spinner data-icon="inline-start" />}
                {t("auth.login.submit")}
              </Button>
              {env.enableMock && (
                <p className="text-center text-xs text-muted-foreground">
                  {t("auth.login.demoHint", DEMO_ACCOUNT)}
                </p>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
