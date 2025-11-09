import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FormRenderer } from "../form-renderer"
import type { FormField } from "@/lib/types"

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}))

// Mock MediaUploader and GPSCapture components
jest.mock("../media-uploader", () => ({
  MediaUploader: ({ onUploadSuccess }: any) => (
    <button onClick={() => onUploadSuccess("https://example.com/file.jpg")}>Upload File</button>
  ),
}))

jest.mock("../gps-capture", () => ({
  GPSCapture: ({ onCapture }: any) => (
    <button
      onClick={() =>
        onCapture({
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
        })
      }
    >
      Capture GPS
    </button>
  ),
}))

describe("FormRenderer", () => {
  const mockOnSubmit = jest.fn()
  const basicFields: FormField[] = [
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
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render form with title", () => {
      render(
        <FormRenderer
          formId="form-1"
          formTitle="Test Form"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText("Test Form")).toBeInTheDocument()
    })

    it("should render all form fields", () => {
      render(
        <FormRenderer
          formId="form-1"
          formTitle="Test Form"
          description=""
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    })

    it("should show required indicators for required fields", () => {
      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      const requiredIndicators = screen.getAllByText("*")
      expect(requiredIndicators.length).toBeGreaterThan(0)
    })

    it("should render branding elements when provided", () => {
      const branding = {
        logo_url: "https://example.com/logo.png",
        banner_url: "https://example.com/banner.png",
        header_text: "Welcome to our form",
      }

      render(
        <FormRenderer
          formId="form-1"
          formTitle="Test Form"
          description=""
          fields={basicFields}
          branding={branding}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText("Welcome to our form")).toBeInTheDocument()
    })

    it("should render form description when provided", () => {
      render(
        <FormRenderer
          formId="form-1"
          formTitle="Test Form"
          description="This is a test form description"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText("This is a test form description")).toBeInTheDocument()
    })

    it("should not render description when empty", () => {
      render(
        <FormRenderer
          formId="form-1"
          formTitle="Test Form"
          description=""
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.queryByText("This is a test form description")).not.toBeInTheDocument()
    })

    it("should render form description when provided", () => {
      render(
        <FormRenderer
          formId="form-1"
          formTitle="Test Form"
          description="This is a test form description"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText("This is a test form description")).toBeInTheDocument()
    })

    it("should not render description when empty", () => {
      render(
        <FormRenderer
          formId="form-1"
          formTitle="Test Form"
          description=""
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.queryByText("This is a test form description")).not.toBeInTheDocument()
    })
  })

  describe("Field Types", () => {
    it("should render text input field", () => {
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "text",
          label: "Name",
          required: true,
        },
      ]

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByRole("textbox", { name: /Name/i })).toBeInTheDocument()
    })

    it("should render textarea field", () => {
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "textarea",
          label: "Description",
          required: false,
        },
      ]

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByRole("textbox", { name: /Description/i })).toBeInTheDocument()
    })

    it("should render select field", () => {
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "select",
          label: "Country",
          required: true,
          options: ["USA", "Canada", "Mexico"],
        },
      ]

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByRole("combobox", { name: /Country/i })).toBeInTheDocument()
      expect(screen.getByText("USA")).toBeInTheDocument()
    })

    it("should render radio buttons", () => {
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "radio",
          label: "Gender",
          required: true,
          options: ["Male", "Female", "Other"],
        },
      ]

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByLabelText("Male")).toBeInTheDocument()
      expect(screen.getByLabelText("Female")).toBeInTheDocument()
    })

    it("should render checkboxes", () => {
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "checkbox",
          label: "Interests",
          required: false,
          options: ["Sports", "Music", "Reading"],
        },
      ]

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText("Sports")).toBeInTheDocument()
      expect(screen.getByText("Music")).toBeInTheDocument()
    })
  })

  describe("Validation", () => {
    it("should show error for required field when empty", async () => {
      const { toast } = require("@/hooks/use-toast")
      const user = userEvent.setup()

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Validation Error",
            variant: "destructive",
          })
        )
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it("should validate email format", async () => {
      const user = userEvent.setup()

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Name/i)
      const emailInput = screen.getByLabelText(/Email/i)

      await user.type(nameInput, "John Doe")
      await user.type(emailInput, "invalid-email")

      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/must be a valid email/i)).toBeInTheDocument()
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it("should validate number range", async () => {
      const user = userEvent.setup()
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "number",
          label: "Age",
          required: true,
          validation: {
            min: 18,
            max: 100,
          },
        },
      ]

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      const ageInput = screen.getByLabelText(/Age/i)
      await user.type(ageInput, "150")

      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/must be at most 100/i)).toBeInTheDocument()
      })
    })

    it("should clear error when user starts typing", async () => {
      const user = userEvent.setup()

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      // Submit to trigger validation
      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      })

      // Start typing
      const nameInput = screen.getByLabelText(/Name/i)
      await user.type(nameInput, "J")

      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      const { toast } = require("@/hooks/use-toast")
      const user = userEvent.setup()

      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Name/i)
      const emailInput = screen.getByLabelText(/Email/i)

      await user.type(nameInput, "John Doe")
      await user.type(emailInput, "john@example.com")

      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            "field-1": "John Doe",
            "field-2": "john@example.com",
          }),
          expect.any(Object)
        )
        expect(toast).toHaveBeenCalledWith({
          title: "Success",
          description: "Form submitted successfully",
          variant: "success",
        })
      })
    })

    it("should show error toast on submission failure", async () => {
      const { toast } = require("@/hooks/use-toast")
      const user = userEvent.setup()

      mockOnSubmit.mockRejectedValue(new Error("Submission failed"))

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={basicFields}
          onSubmit={mockOnSubmit}
        />
      )

      const nameInput = screen.getByLabelText(/Name/i)
      const emailInput = screen.getByLabelText(/Email/i)

      await user.type(nameInput, "John Doe")
      await user.type(emailInput, "john@example.com")

      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Submission Failed",
          description: "Submission failed",
          variant: "destructive",
        })
      })
    })

    it("should disable submit button while submitting", async () => {
      const user = userEvent.setup()

      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

      render(
        <FormRenderer
          formId="form-1"
          formTitle="Test Form"
          description=""
          fields={basicFields}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      )

      const submitButton = screen.getByRole("button", { name: /Submitting/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe("Field Interactions", () => {
    it("should handle checkbox group selection", async () => {
      const user = userEvent.setup()
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "checkbox",
          label: "Interests",
          required: false,
          options: ["Sports", "Music", "Reading"],
        },
      ]

      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      const sportsCheckbox = screen.getByText("Sports").previousSibling as HTMLElement
      const musicCheckbox = screen.getByText("Music").previousSibling as HTMLElement

      await user.click(sportsCheckbox)
      await user.click(musicCheckbox)

      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            "field-1": expect.arrayContaining(["Sports", "Music"]),
          }),
          expect.any(Object)
        )
      })
    })

    it("should handle file upload", async () => {
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "file",
          label: "Upload Document",
          required: true,
        },
      ]

      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      const uploadButton = screen.getByText("Upload File")
      fireEvent.click(uploadButton)

      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            "field-1": "https://example.com/file.jpg",
          })
        )
      })
    })

    it("should handle GPS capture", async () => {
      const fields: FormField[] = [
        {
          id: "field-1",
          type: "gps",
          label: "Location",
          required: true,
        },
      ]

      mockOnSubmit.mockResolvedValue(undefined)

      render(
        <FormRenderer
          formTitle="Test Form"
          description=""
          formId="form-1"
          fields={fields}
          onSubmit={mockOnSubmit}
        />
      )

      const captureButton = screen.getByText("Capture GPS")
      fireEvent.click(captureButton)

      const submitButton = screen.getByRole("button", { name: /Submit Response/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            "field-1": expect.objectContaining({
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 10,
            }),
          }),
          expect.any(Object)
        )
      })
    })
  })
})
