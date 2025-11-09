import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authAPI } from "@/lib/api"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { queryKeys } from "@/lib/query-client"

// Login mutation
export function useLogin() {
  const { setToken, setUser } = useStore()
  const { toast } = useToast()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await authAPI.login(username, password)
      return response.data.data
    },
    onSuccess: (data) => {
      setToken(data.access_token)
      setUser(data.user)
      toast({
        title: "Success",
        description: "Logged in successfully",
      })
      router.push("/dashboard")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Invalid credentials",
        variant: "destructive",
      })
    },
  })
}

// Logout mutation
export function useLogout() {
  const { logout } = useStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      // Perform any logout API call if needed
      return Promise.resolve()
    },
    onSuccess: () => {
      logout()
      queryClient.clear() // Clear all cached queries
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
      router.push("/login")
    },
  })
}

// Register mutation
export function useRegister() {
  const { toast } = useToast()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: {
      username: string
      password: string
      role: "admin" | "agent"
      organization_id: string
    }) => {
      const response = await authAPI.register(data)
      return response.data.data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account created successfully. Please log in.",
      })
      router.push("/login")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create account",
        variant: "destructive",
      })
    },
  })
}

// Restore user session (called on app init)
export function useRestoreSession() {
  const { setUser } = useStore()

  return useMutation({
    mutationFn: async (token: string) => {
      // This will use the token from localStorage via the axios interceptor
      const { usersAPI } = await import("@/lib/api")
      const response = await usersAPI.getMe()
      return response.data.data
    },
    onSuccess: (user) => {
      setUser(user)
    },
    onError: () => {
      // Token is invalid, logout
      useStore.getState().logout()
    },
  })
}
