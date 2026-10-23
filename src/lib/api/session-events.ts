type Listener = () => void

const listeners = new Set<Listener>()

/**
 * Fired by the API client when a 401 can't be fixed by refreshing the token.
 * The app listens once (src/router.tsx) to clear cached data and go to /login,
 * so the API layer never has to know about the router or the UI.
 */
export function onSessionExpired(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifySessionExpired() {
  listeners.forEach((listener) => listener())
}
