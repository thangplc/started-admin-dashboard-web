import { faker } from "@faker-js/faker"

import { UserRole, UserStatus, type User } from "@/api/generated/model"
import { DEMO_ACCOUNT } from "./demo-account"

/** Short on purpose, so the refresh-token flow is easy to see in dev. */
export const ACCESS_TOKEN_TTL_SECONDS = 5 * 60

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000

// Same data on every reload.
faker.seed(42)

function createUser(overrides: Partial<User> = {}): User {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName, provider: "example.com" }).toLowerCase(),
    role: faker.helpers.weightedArrayElement([
      { weight: 1, value: UserRole.admin },
      { weight: 3, value: UserRole.editor },
      { weight: 6, value: UserRole.viewer },
    ]),
    status: faker.helpers.weightedArrayElement([
      { weight: 7, value: UserStatus.active },
      { weight: 2, value: UserStatus.inactive },
      { weight: 1, value: UserStatus.invited },
    ]),
    avatarUrl: null,
    // Skewed towards recent dates, so the dashboard shows a growing sign-up curve.
    createdAt: new Date(Date.now() - faker.number.float() ** 1.8 * TWO_YEARS_MS).toISOString(),
    ...overrides,
  }
}

const demoAdmin = createUser({
  name: "Demo Admin",
  email: DEMO_ACCOUNT.email,
  role: UserRole.admin,
  status: UserStatus.active,
})

const SESSIONS_KEY = "mock.sessions"

/**
 * refreshToken → userId, kept in localStorage: a real backend remembers sessions across
 * page reloads, so the mock must too, or every F5 would break the refresh-token flow.
 */
class SessionStore extends Map<string, string> {
  constructor() {
    super()
    try {
      const saved = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]") as [string, string][]
      saved.forEach(([token, userId]) => super.set(token, userId))
    } catch {
      // Nothing saved or storage blocked: start empty.
    }
  }

  override set(token: string, userId: string) {
    super.set(token, userId)
    this.save()
    return this
  }

  override delete(token: string) {
    const deleted = super.delete(token)
    this.save()
    return deleted
  }

  private save() {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify([...this]))
    } catch {
      // Storage blocked: sessions last until reload.
    }
  }
}

/**
 * The "database" behind the mock API. Users live in memory and reset on reload, so
 * create / edit / delete behave like a real backend within a session; sessions persist.
 */
export const db = {
  users: [demoAdmin, ...Array.from({ length: 179 }, () => createUser())],
  sessions: new SessionStore(),
  passwords: new Map<string, string>([[demoAdmin.id, DEMO_ACCOUNT.password]]),
}
