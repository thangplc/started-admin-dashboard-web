const ACCESS_KEY = "auth.accessToken"
const REFRESH_KEY = "auth.refreshToken"

export type Tokens = { accessToken: string; refreshToken: string }

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Where the JWT pair lives between page loads. The API client reads the access token
 * from here; login / refresh / logout write it (step 3 builds the auth flow on top).
 */
export const tokenStore = {
  getAccessToken: () => read(ACCESS_KEY),
  getRefreshToken: () => read(REFRESH_KEY),

  set(tokens: Tokens) {
    try {
      localStorage.setItem(ACCESS_KEY, tokens.accessToken)
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
    } catch {
      // Storage blocked: the session ends with the tab.
    }
  },

  clear() {
    try {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    } catch {
      // Nothing stored.
    }
  },
}
