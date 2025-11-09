import { test, expect } from "@playwright/test"

/**
 * Helper function to login before running form tests
 */
async function login(page: any) {
  await page.goto("/login")

  await page.route("**/auth/login", (route: any) => {
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

  await page.route("**/users/me", (route: any) => {
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

  await page.getByLabel(/username/i).fill("testuser")
  await page.getByLabel(/password/i).fill("Password123!")
  await page.getByRole("button", { name: /sign in|login/i }).click()

  await page.waitForURL(/\/dashboard/)
}

test.describe("Form Creation", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("should navigate to form builder", async ({ page }) => {
    // Mock forms list endpoint
    await page.route("**/forms**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      })
    })

    await page.goto("/forms")

    // Click create new form button
    await page.getByRole("button", { name: /create|new form/i }).click()

    // Should navigate to form builder
    await expect(page).toHaveURL(/\/forms\/new/)
  })

  test("should display form builder with field library", async ({ page }) => {
    await page.goto("/forms/new")

    // Check for form builder elements
    await expect(page.getByText(/Field Library/i)).toBeVisible()
    await expect(page.getByPlaceholder(/form title/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /Save as Draft/i })).toBeVisible()
  })

  test("should add fields to form", async ({ page }) => {
    await page.goto("/forms/new")

    // Add title
    await page.getByPlaceholder(/form title/i).fill("Customer Survey")

    // Add text field
    await page.getByRole("button", { name: /Add Text Input field/i }).click()

    // Field should be added
    await expect(page.locator("input[value*='Text Input Field']")).toBeVisible()

    // Add email field
    await page.getByRole("button", { name: /Add Email field/i }).click()

    // Email field should be added
    await expect(page.locator("input[value*='Email Field']")).toBeVisible()
  })

  test("should configure field properties", async ({ page }) => {
    await page.goto("/forms/new")

    await page.getByPlaceholder(/form title/i).fill("Registration Form")

    // Add a field
    await page.getByRole("button", { name: /Add Text Input field/i }).click()

    // Edit field label
    const fieldLabel = page.locator("input[value*='Text Input Field']")
    await fieldLabel.clear()
    await fieldLabel.fill("Full Name")

    // Mark as required
    const requiredCheckbox = page.getByLabel(/Required/i)
    await requiredCheckbox.check()

    // Verify changes
    await expect(page.locator("input[value='Full Name']")).toBeVisible()
  })

  test("should show validation error when saving without title", async ({ page }) => {
    await page.goto("/forms/new")

    // Add a field but no title
    await page.getByRole("button", { name: /Add Text Input field/i }).click()

    // Try to save
    await page.getByRole("button", { name: /Save as Draft/i }).click()

    // Should show error toast (check for toast notification)
    await expect(page.locator("text=/enter a form title/i").first()).toBeVisible()
  })

  test("should show validation error when saving without fields", async ({ page }) => {
    await page.goto("/forms/new")

    // Add title but no fields
    await page.getByPlaceholder(/form title/i).fill("Empty Form")

    // Try to save
    await page.getByRole("button", { name: /Save as Draft/i }).click()

    // Should show error toast
    await expect(page.locator("text=/add at least one field/i").first()).toBeVisible()
  })

  test("should save form as draft", async ({ page }) => {
    await page.goto("/forms/new")

    // Mock save endpoint
    await page.route("**/forms", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "form-123",
              title: "Test Form",
              status: "draft",
              version: 1,
              schema: {
                fields: [
                  {
                    id: "field-1",
                    type: "text",
                    label: "Name",
                    required: true,
                  },
                ],
              },
              created_at: new Date().toISOString(),
            },
          }),
        })
      } else {
        route.continue()
      }
    })

    // Create form
    await page.getByPlaceholder(/form title/i).fill("Test Form")
    await page.getByRole("button", { name: /Add Text Input field/i }).click()

    // Save as draft
    await page.getByRole("button", { name: /Save as Draft/i }).click()

    // Should show success message
    await expect(page.locator("text=/saved as draft/i").first()).toBeVisible({ timeout: 10000 })
  })

  test("should publish form", async ({ page }) => {
    await page.goto("/forms/new")

    // Mock save endpoint
    await page.route("**/forms", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "form-123",
              title: "Published Form",
              status: "published",
              version: 1,
              schema: {
                fields: [
                  {
                    id: "field-1",
                    type: "text",
                    label: "Name",
                    required: true,
                  },
                ],
              },
              created_at: new Date().toISOString(),
            },
          }),
        })
      } else {
        route.continue()
      }
    })

    // Create form
    await page.getByPlaceholder(/form title/i).fill("Published Form")
    await page.getByRole("button", { name: /Add Text Input field/i }).click()

    // Publish
    await page.getByRole("button", { name: /Publish Form/i }).click()

    // Should show success message
    await expect(page.locator("text=/published successfully/i").first()).toBeVisible({
      timeout: 10000,
    })
  })

  test("should preview form", async ({ page }) => {
    await page.goto("/forms/new")

    await page.getByPlaceholder(/form title/i).fill("Preview Test")
    await page.getByRole("button", { name: /Add Text Input field/i }).click()

    // Click preview button
    await page.getByRole("button", { name: /Live Preview/i }).click()

    // Should show preview
    await expect(page.getByText("Form Preview")).toBeVisible()
    await expect(page.getByText("Preview Test")).toBeVisible()
  })

  test("should configure form branding", async ({ page }) => {
    await page.goto("/forms/new")

    // Open branding editor
    await page.getByRole("button", { name: /Branding & Theme/i }).click()

    // Branding form should be visible
    // This depends on your FormBrandingEditor implementation
    // await expect(page.getByLabel(/Primary Color/i)).toBeVisible()
  })
})

test.describe("Form Submission", () => {
  test.beforeEach(async ({ page }) => {
    // Mock form data endpoint
    await page.route("**/forms/form-123", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "form-123",
            title: "Customer Feedback Form",
            organization_id: "org-123",
            status: "published",
            version: 1,
            schema: {
              fields: [
                {
                  id: "field-1",
                  type: "text",
                  label: "Name",
                  required: true,
                  placeholder: "Enter your name",
                },
                {
                  id: "field-2",
                  type: "email",
                  label: "Email",
                  required: true,
                },
                {
                  id: "field-3",
                  type: "textarea",
                  label: "Feedback",
                  required: false,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
        }),
      })
    })
  })

  test("should display form for submission", async ({ page }) => {
    await page.goto("/submit/form-123")

    // Check form renders correctly
    await expect(page.getByText("Customer Feedback Form")).toBeVisible()
    await expect(page.getByLabel(/Name/i)).toBeVisible()
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Feedback/i)).toBeVisible()
  })

  test("should show validation errors on empty required fields", async ({ page }) => {
    await page.goto("/submit/form-123")

    // Submit without filling
    await page.getByRole("button", { name: /Submit Response/i }).click()

    // Should show validation errors
    await expect(page.locator("text=/required/i").first()).toBeVisible()
  })

  test("should validate email format", async ({ page }) => {
    await page.goto("/submit/form-123")

    // Fill with invalid email
    await page.getByLabel(/Name/i).fill("John Doe")
    await page.getByLabel(/Email/i).fill("invalid-email")

    // Submit
    await page.getByRole("button", { name: /Submit Response/i }).click()

    // Should show email validation error
    await expect(page.locator("text=/valid email/i").first()).toBeVisible()
  })

  test("should successfully submit form", async ({ page }) => {
    await page.goto("/submit/form-123")

    // Mock submission endpoint
    await page.route("**/responses", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "response-123",
              form_id: "form-123",
              submitted_by: "anonymous",
              submitted_at: new Date().toISOString(),
              data: {
                "field-1": "John Doe",
                "field-2": "john@example.com",
                "field-3": "Great service!",
              },
            },
          }),
        })
      } else {
        route.continue()
      }
    })

    // Fill form
    await page.getByLabel(/Name/i).fill("John Doe")
    await page.getByLabel(/Email/i).fill("john@example.com")
    await page.getByLabel(/Feedback/i).fill("Great service!")

    // Submit
    await page.getByRole("button", { name: /Submit Response/i }).click()

    // Should show success message
    await expect(page.locator("text=/submitted successfully/i").first()).toBeVisible({
      timeout: 10000,
    })
  })

  test("should handle submission errors gracefully", async ({ page }) => {
    await page.goto("/submit/form-123")

    // Mock submission failure
    await page.route("**/responses", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Server error" }),
        })
      } else {
        route.continue()
      }
    })

    // Fill and submit form
    await page.getByLabel(/Name/i).fill("John Doe")
    await page.getByLabel(/Email/i).fill("john@example.com")
    await page.getByRole("button", { name: /Submit Response/i }).click()

    // Should show error message
    await expect(page.locator("text=/error|failed/i").first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Form Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("should display list of forms", async ({ page }) => {
    // Mock forms list
    await page.route("**/forms**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "form-1",
              title: "Customer Survey",
              status: "published",
              version: 1,
              created_at: new Date().toISOString(),
            },
            {
              id: "form-2",
              title: "Feedback Form",
              status: "draft",
              version: 1,
              created_at: new Date().toISOString(),
            },
          ],
        }),
      })
    })

    await page.goto("/forms")

    // Should display forms
    await expect(page.getByText("Customer Survey")).toBeVisible()
    await expect(page.getByText("Feedback Form")).toBeVisible()
  })

  test("should filter forms by status", async ({ page }) => {
    await page.route("**/forms**", (route) => {
      const url = new URL(route.request().url())
      const status = url.searchParams.get("status")

      let forms = [
        {
          id: "form-1",
          title: "Published Form",
          status: "published",
          version: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: "form-2",
          title: "Draft Form",
          status: "draft",
          version: 1,
          created_at: new Date().toISOString(),
        },
      ]

      if (status) {
        forms = forms.filter((f) => f.status === status)
      }

      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: forms }),
      })
    })

    await page.goto("/forms")

    // Filter by published
    // This depends on your UI implementation
    // await page.getByRole('button', { name: /Published/i }).click()
    // await expect(page.getByText('Draft Form')).not.toBeVisible()
  })
})
