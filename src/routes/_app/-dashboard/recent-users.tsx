import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import type { User } from "@/api/generated/model"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDate, initials } from "@/lib/format"

/** The newest users; each row opens the edit page. */
export function RecentUsers({ users }: { users: User[] }) {
  const { t } = useTranslation()

  return (
    <ul className="-mx-2 flex flex-col">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            to="/users/$userId"
            params={{ userId: user.id }}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
          >
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant="secondary">{t(`users.status.${user.status}`)}</Badge>
              <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
