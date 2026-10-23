import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

export type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

/** Same key as the inline script in index.html, which applies the theme before first paint. */
const STORAGE_KEY = "theme"
const DARK_QUERY = "(prefers-color-scheme: dark)"

type ThemeContextValue = {
  /** What the user picked. */
  theme: Theme
  /** What is actually applied (`system` resolved to light / dark). */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light"
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  // Suppress transitions for one frame so colours don't animate on switch.
  const style = document.createElement("style")
  style.textContent = "*,*::before,*::after{transition:none!important}"
  document.head.appendChild(style)

  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme

  requestAnimationFrame(() => style.remove())
}

/**
 * Light / dark / system theme for a client-only app: toggles the `.dark` class on <html>
 * and remembers the choice in localStorage. API matches next-themes' `useTheme`.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme)
  const resolvedTheme = theme === "system" ? systemTheme : theme

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked (private mode): the choice lasts for this session only.
    }
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>")
  return context
}
