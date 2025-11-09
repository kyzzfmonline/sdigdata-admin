import { create } from "zustand"
import type { AuthState, User, UserRole, UserPermission } from "./types"
import { usersAPI } from "./api"
import { logger } from "./logger"

interface AppStore extends AuthState {
  // Permissions and roles
  userRoles: UserRole[]
  userPermissions: UserPermission[]
  setUserRoles: (roles: UserRole[]) => void
  setUserPermissions: (permissions: UserPermission[]) => void

  // Auth methods
  setToken: (token: string) => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  restoreUser: () => Promise<void>
  loadUserPermissions: () => Promise<void>
}

export const useStore = create<AppStore>((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  isLoading: false,
  error: null,
  userRoles: [],
  userPermissions: [],

  setToken: (token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token)
    }
    set({ token })
  },

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setUserRoles: (userRoles) => set({ userRoles }),
  setUserPermissions: (userPermissions) => set({ userPermissions }),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("access_token")
      localStorage.removeItem("login_data")
    }
    set({ token: null, user: null, userRoles: [], userPermissions: [] })
  },

  restoreUser: async () => {
    const token = get().token
    if (!token) return

    try {
      const response = await usersAPI.getMe()
      const userData = response.data.data
      set({ user: userData })

      // If user endpoint returns roles and permissions, use them
      if (userData.roles && userData.permissions) {
        set({ userRoles: userData.roles, userPermissions: userData.permissions })
        // Store user data for permission context
        localStorage.setItem("user_data", JSON.stringify(userData))
      } else {
        // Fallback to loading from localStorage if available and not expired
        const loginData = localStorage.getItem("login_data")
        if (loginData) {
          try {
            const parsed = JSON.parse(loginData)
            // Check if data is expired (24 hours)
            const now = Date.now()
            const expiryTime = parsed.timestamp + 24 * 60 * 60 * 1000 // 24 hours

            if (now > expiryTime) {
              localStorage.removeItem("login_data")
              console.log("Stored login data expired")
            } else if (parsed.permissions && parsed.roles) {
              set({ userPermissions: parsed.permissions, userRoles: parsed.roles })
            }
          } catch (error) {
            console.error("Failed to parse stored login data:", error)
            localStorage.removeItem("login_data")
          }
        }
      }
    } catch (error) {
      // If token is invalid, logout
      logger.warn("Failed to restore user session", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      get().logout()
    }
  },

  loadUserPermissions: async () => {
    const user = get().user
    if (!user) return

    try {
      const [rolesRes, permsRes] = await Promise.all([
        usersAPI.getUserRoles(user.id),
        usersAPI.getUserPermissions(user.id),
      ])

      if (rolesRes.data.success && permsRes.data.success) {
        set({
          userRoles: rolesRes.data.data,
          userPermissions: permsRes.data.data,
        })
      }
    } catch (error) {
      logger.error("Failed to load user permissions", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },
}))
