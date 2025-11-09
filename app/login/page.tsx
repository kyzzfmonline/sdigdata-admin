"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useStore } from "@/lib/store"
import { usePermissions } from "@/lib/permission-context"
import { authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { loginSchema, type LoginInput } from "@/lib/validations"
import { logger } from "@/lib/logger"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export default function LoginPage() {
  const router = useRouter()
  const { setToken, setUser } = useStore()
  const { setPermissionsFromLogin } = usePermissions()
  const { toast } = useToast()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginInput) => {
    logger.debug("Login attempt initiated", { username: data.username })

    try {
      const response = await authAPI.login(data.username, data.password)
      const { access_token, user } = response.data.data

      // Store token in Zustand store (which also saves to localStorage as "token")
      setToken(access_token)
      setUser(user)

      // Also store as "access_token" for permission fetching (backward compatibility)
      localStorage.setItem("access_token", access_token)

      // Fetch user permissions and roles after successful login
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const permsResponse = await fetch(`${apiUrl}/users/me/permissions`, {
          headers: { Authorization: `Bearer ${access_token}` },
        })

        if (permsResponse.ok) {
          const permsData = await permsResponse.json()
          const { permissions, roles } = permsData.data

          // Store login data in localStorage for permission initialization with timestamp
          localStorage.setItem(
            "login_data",
            JSON.stringify({
              permissions,
              roles,
              timestamp: Date.now(),
            })
          )

          // Set permissions in context
          setPermissionsFromLogin({ permissions, roles })
        }
      } catch (permError) {
        logger.warn("Failed to fetch permissions after login", { error: permError })
        // Continue with login even if permission fetch fails
      }

      logger.info("User logged in successfully", {
        userId: user.id,
        role: user.role,
      })

      toast({
        title: "Logged in successfully",
        variant: "success",
      })

      // Role-based redirect
      if (user.role === "agent") {
        router.push("/agent")
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      logger.warn("Login attempt failed", {
        username: data.username,
        errorMessage: error.message,
      })
      toast({
        title: "Invalid username or password",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-border">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary mb-4">
            <svg
              className="w-10 h-10 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">SDIGdata</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Metropolitan Assembly Data Collection System
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter your username"
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your password"
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-11 font-medium"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Logging in..." : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Authorized personnel only. All access is monitored.
          </p>
        </div>
      </Card>
    </div>
  )
}
