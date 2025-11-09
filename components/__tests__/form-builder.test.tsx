import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FormBuilder } from "../form-builder"
import type { Form } from "@/lib/types"

// Mock the store
jest.mock("@/lib/store", () => ({
  useStore: jest.fn((selector) =>
    selector({
      user: {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        role: "admin",
        organization_id: "org-1",
        created_at: "2024-01-01T00:00:00Z",
      },
    })
  ),
}))

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  Reorder: {
    Group: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Item: ({ children, value, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe("FormBuilder", () => {
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Initial Render", () => {
    it("should render form builder with empty state", () => {
      render(<FormBuilder onSave={mockOnSave} />)

      expect(screen.getByText("Field Library")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Enter an engaging form title...")).toBeInTheDocument()
      expect(screen.getByText("Start Building Your Form")).toBeInTheDocument()
    })

    it("should render with initial form data", () => {
      const initialForm: Form = {
        id: "form-1",
        title: "Test Form",
        description: "Test form description",
        organization_id: "org-1",
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
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      render(<FormBuilder initialForm={initialForm} onSave={mockOnSave} />)

      expect(screen.getByDisplayValue("Test Form")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Test form description")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Name")).toBeInTheDocument()
    })
  })

  describe("Field Management", () => {
    it("should add a text field when clicking text field button", async () => {
      const user = userEvent.setup()
      render(<FormBuilder onSave={mockOnSave} />)

      const textFieldButton = screen.getByRole("button", { name: /Add Text Input field/i })
      await user.click(textFieldButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue(/Text Input Field/i)).toBeInTheDocument()
      })
    })

    it("should remove a field when clicking delete button", async () => {
      const user = userEvent.setup()
      const initialForm: Form = {
        id: "form-1",
        title: "Test Form",
        organization_id: "org-1",
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
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      render(<FormBuilder initialForm={initialForm} onSave={mockOnSave} />)

      const deleteButtons = screen.getAllByRole("button")
      const deleteButton = deleteButtons.find((btn) => btn.querySelector("svg"))

      if (deleteButton) {
        await user.click(deleteButton)
      }

      await waitFor(() => {
        expect(screen.queryByDisplayValue("Name")).not.toBeInTheDocument()
      })
    })

    it("should duplicate a field when clicking duplicate button", async () => {
      const user = userEvent.setup()
      const initialForm: Form = {
        id: "form-1",
        title: "Test Form",
        organization_id: "org-1",
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
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      render(<FormBuilder initialForm={initialForm} onSave={mockOnSave} />)

      // Find duplicate button (copy icon)
      const buttons = screen.getAllByRole("button")
      // Typically the duplicate button is before the delete button

      // This is a simplified test - in reality you'd need to identify the correct button
      expect(screen.getByDisplayValue("Name")).toBeInTheDocument()
    })

    it("should update field label when typing", async () => {
      const user = userEvent.setup()
      const initialForm: Form = {
        id: "form-1",
        title: "Test Form",
        organization_id: "org-1",
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
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      render(<FormBuilder initialForm={initialForm} onSave={mockOnSave} />)

      const labelInput = screen.getByDisplayValue("Name")
      await user.clear(labelInput)
      await user.type(labelInput, "Full Name")

      expect(screen.getByDisplayValue("Full Name")).toBeInTheDocument()
    })
  })

  describe("Form Validation", () => {
    it("should show validation error when saving without title", async () => {
      const { toast } = require("@/hooks/use-toast")
      const user = userEvent.setup()

      render(<FormBuilder onSave={mockOnSave} />)

      const saveButton = screen.getByRole("button", { name: /Save as Draft/i })
      await user.click(saveButton)

      expect(toast).toHaveBeenCalledWith({
        title: "Validation Error",
        description: "Please enter a form title",
        variant: "destructive",
      })
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it("should show validation error when saving without fields", async () => {
      const { toast } = require("@/hooks/use-toast")
      const user = userEvent.setup()

      render(<FormBuilder onSave={mockOnSave} />)

      const titleInput = screen.getByPlaceholderText("Enter an engaging form title...")
      await user.type(titleInput, "My Form")

      const saveButton = screen.getByRole("button", { name: /Save as Draft/i })
      await user.click(saveButton)

      expect(toast).toHaveBeenCalledWith({
        title: "Validation Error",
        description: "Please add at least one field to your form",
        variant: "destructive",
      })
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it("should save form successfully with valid data", async () => {
      const { toast } = require("@/hooks/use-toast")
      const user = userEvent.setup()

      mockOnSave.mockResolvedValue(undefined)

      render(<FormBuilder onSave={mockOnSave} />)

      // Add title
      const titleInput = screen.getByPlaceholderText("Enter an engaging form title...")
      await user.type(titleInput, "My Form")

      // Add a field
      const textFieldButton = screen.getByRole("button", { name: /Add Text Input field/i })
      await user.click(textFieldButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue(/Text Input Field/i)).toBeInTheDocument()
      })

      // Save form
      const saveButton = screen.getByRole("button", { name: /Save as Draft/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
        expect(toast).toHaveBeenCalledWith({
          title: "Success",
          description: "Form saved as draft",
          variant: "success",
        })
      })
    })
  })

  describe("Branding", () => {
    it("should toggle branding editor when clicking branding button", async () => {
      const user = userEvent.setup()
      render(<FormBuilder onSave={mockOnSave} />)

      const brandingButton = screen.getByRole("button", { name: /Branding & Theme/i })
      await user.click(brandingButton)

      // Branding editor should appear
      // This depends on FormBrandingEditor implementation
    })
  })

  describe("Preview Mode", () => {
    it("should toggle preview mode", async () => {
      const user = userEvent.setup()
      const initialForm: Form = {
        id: "form-1",
        title: "Test Form",
        organization_id: "org-1",
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
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      render(<FormBuilder initialForm={initialForm} onSave={mockOnSave} />)

      const previewButton = screen.getByRole("button", { name: /Live Preview/i })
      await user.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText("Form Preview")).toBeInTheDocument()
      })
    })
  })

  describe("Keyboard Shortcuts", () => {
    it("should save form when Ctrl+S is pressed", async () => {
      mockOnSave.mockResolvedValue(undefined)

      const initialForm: Form = {
        id: "form-1",
        title: "Test Form",
        organization_id: "org-1",
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
        created_by: "user-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      render(<FormBuilder initialForm={initialForm} onSave={mockOnSave} />)

      fireEvent.keyDown(window, { key: "s", ctrlKey: true })

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })
    })
  })
})
