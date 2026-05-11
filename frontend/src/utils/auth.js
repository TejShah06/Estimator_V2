// ── Token Manager ─────────────────────────────────────────────────────────────
// Uses sessionStorage so token clears when tab/browser closes

export const setToken = (token) => {
  sessionStorage.setItem("token", token)
  // Remove from localStorage if it exists (migration)
  localStorage.removeItem("token")
}

export const getToken = () => {
  //    Step 1: Check sessionStorage first
  const sessionToken = sessionStorage.getItem("token")
  if (sessionToken) return sessionToken

  //    Step 2: Check localStorage (old method — migrate it)
  const localToken = localStorage.getItem("token")  // ← direct call, NOT getToken()
  if (localToken) {
    // Migrate to sessionStorage so tab-close logout works
    sessionStorage.setItem("token", localToken)
    localStorage.removeItem("token")
    return localToken
  }

  //    Step 3: No token found anywhere
  return null
}

export const removeToken = () => {
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("user")
  sessionStorage.removeItem("username")
  sessionStorage.removeItem("role")
  sessionStorage.removeItem("user_id")
  sessionStorage.removeItem("email")
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  localStorage.removeItem("username")
  localStorage.removeItem("role")
  localStorage.removeItem("user_id")
  localStorage.removeItem("email")
}

export const setUser = (user) => {
  sessionStorage.setItem("user", JSON.stringify(user))
}

export const getUser = () => {
  try {
    const user = sessionStorage.getItem("user")
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

export const isLoggedIn = () => {
  return !!getToken()
}