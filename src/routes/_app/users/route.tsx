import { createFileRoute, Outlet } from "@tanstack/react-router"

/** Groups /users, /users/new and /users/$userId under one breadcrumb: "Users › ...". */
export const Route = createFileRoute("/_app/users")({
  staticData: { breadcrumb: "nav.users" },
  component: Outlet,
})
