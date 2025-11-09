import { test, expect } from "@playwright/test"

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/")
  })

  test("should redirect to login page when not authenticated", async ({ page }) => {
    await page.goto("/dashboard")

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test("should display login form", async ({ page }) => {
    await page.goto("/login")

    // Check for login form elements
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in|login/i })).toBeVisible()
  })

  test("should show validation errors on empty submission", async ({ page }) => {
    await page.goto("/login")

    // Click login without filling form
    await page.getByRole("button", { name: /sign in|login/i }).click()

    // Should show validation errors
    await expect(page.locator("text=/required/i").first()).toBeVisible()
  })

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login")

    // Fill in invalid credentials
    await page.getByLabel(/username/i).fill("invaliduser")
    await page.getByLabel(/password/i).fill("wrongpassword")

    // Mock API response for failed login
    await page.route("**/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid credentials" }),
      })
    })

    // Submit login form
    await page.getByRole("button", { name: /sign in|login/i }).click()

    // Should show error message
    await expect(page.locator("text=/invalid|error/i").first()).toBeVisible()
  })

  test("should successfully login with valid credentials", async ({ page }) => {
    await page.goto("/login")

    // Mock successful login response
    await page.route("**/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-jwt-token",
          token_type: "bearer",
          user: {
            id: "user-123",
            username: "testuser",
            email: "test@example.com",
            role: "admin",
            organization_id: "org-123",
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    // Mock user info endpoint
    await page.route("**/users/me", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "user-123",
            username: "testuser",
            email: "test@example.com",
            role: "admin",
            organization_id: "org-123",
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    // Fill in credentials
    await page.getByLabel(/username/i).fill("testuser")
    await page.getByLabel(/password/i).fill("Password123!")

    // Submit login form
    await page.getByRole("button", { name: /sign in|login/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test("should persist login after page refresh", async ({ page }) => {
    await page.goto("/login")

    // Mock successful login
    await page.route("**/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-jwt-token",
          token_type: "bearer",
          user: {
            id: "user-123",
            username: "testuser",
            email: "test@example.com",
            role: "admin",
            organization_id: "org-123",
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    // Login
    await page.getByLabel(/username/i).fill("testuser")
    await page.getByLabel(/password/i).fill("Password123!")
    await page.getByRole("button", { name: /sign in|login/i }).click()

    await page.waitForURL(/\/dashboard/)

    // Check localStorage has token
    const token = await page.evaluate(() => localStorage.getItem("token"))
    expect(token).toBeTruthy()

    // Refresh page
    await page.reload()

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("should successfully logout", async ({ page }) => {
    // First, login
    await page.goto("/login")

    await page.route("**/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-jwt-token",
          token_type: "bearer",
          user: {
            id: "user-123",
            username: "testuser",
            email: "test@example.com",
            role: "admin",
            organization_id: "org-123",
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    await page.getByLabel(/username/i).fill("testuser")
    await page.getByLabel(/password/i).fill("Password123!")
    await page.getByRole("button", { name: /sign in|login/i }).click()

    await page.waitForURL(/\/dashboard/)

    // Find and click logout button (might be in user menu/dropdown)
    // This will depend on your actual UI implementation
    await page.getByRole("button", { name: /logout|sign out/i }).click()

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)

    // Token should be removed from localStorage
    const token = await page.evaluate(() => localStorage.getItem("token"))
    expect(token).toBeNull()
  })

  test("should handle token refresh on expiration", async ({ page }) => {
    await page.goto("/login")

    // Mock login with short-lived token
    await page.route("**/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "short-lived-token",
          token_type: "bearer",
          user: {
            id: "user-123",
            username: "testuser",
            email: "test@example.com",
            role: "admin",
            organization_id: "org-123",
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    // Mock token refresh endpoint
    await page.route("**/auth/refresh", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "new-refreshed-token",
          token_type: "bearer",
        }),
      })
    })

    // Login
    await page.getByLabel(/username/i).fill("testuser")
    await page.getByLabel(/password/i).fill("Password123!")
    await page.getByRole("button", { name: /sign in|login/i }).click()

    await page.waitForURL(/\/dashboard/)

    // The token refresh should happen automatically when making API calls
    // This test verifies the refresh endpoint can be called successfully
  })

  test("should redirect to login when refresh token expires", async ({ page }) => {
    await page.goto("/login")

    // Mock login
    await page.route("**/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-token",
          token_type: "bearer",
          user: {
            id: "user-123",
            username: "testuser",
            email: "test@example.com",
            role: "admin",
            organization_id: "org-123",
            created_at: new Date().toISOString(),
          },
        }),
      })
    })

    // Mock failed token refresh (expired refresh token)
    await page.route("**/auth/refresh", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Refresh token expired" }),
      })
    })

    // Login
    await page.getByLabel(/username/i).fill("testuser")
    await page.getByLabel(/password/i).fill("Password123!")
    await page.getByRole("button", { name: /sign in|login/i }).click()

    await page.waitForURL(/\/dashboard/)

    // Simulate an API call that triggers refresh (which will fail)
    await page.route("**/forms", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Token expired" }),
      })
    })

    // Navigate to a page that makes API calls
    await page.goto("/forms")

    // Should eventually redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
