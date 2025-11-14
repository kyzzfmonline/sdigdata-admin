/**
 * Field Type Configurations
 * Defines metadata and UI config for each field type
 */

import {
  Type,
  FileText,
  Mail,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  Square,
  MapPin,
  Upload,
  Phone,
  Link,
  Palette,
  Sliders,
  Star,
  PenTool,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { FormField } from "@/lib/types"

export interface FieldTypeConfig {
  type: FormField["type"]
  label: string
  description: string
  icon: LucideIcon
  category: "Basic" | "Choice" | "Advanced" | "Location" | "Media"
  defaultConfig: Partial<FormField>
  supportsOptions: boolean
  supportsValidation: boolean
  supportsPlaceholder: boolean
  supportsHelpText: boolean
  supportsDefaultValue: boolean
  requiredValidation?: string[]
  exampleUseCase: string
}

export const FIELD_TYPE_CONFIGS: Record<FormField["type"], FieldTypeConfig> = {
  text: {
    type: "text",
    label: "Text Input",
    description: "Single-line text input for short responses",
    icon: Type,
    category: "Basic",
    defaultConfig: {
      placeholder: "Enter text here...",
      validation: {
        maxLength: 255,
      },
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: true,
    supportsHelpText: true,
    supportsDefaultValue: true,
    requiredValidation: ["minLength", "maxLength", "pattern"],
    exampleUseCase: "Name, address, short answer",
  },

  textarea: {
    type: "textarea",
    label: "Text Area",
    description: "Multi-line text input for long responses",
    icon: FileText,
    category: "Basic",
    defaultConfig: {
      placeholder: "Enter detailed response...",
      validation: {
        maxLength: 5000,
      },
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: true,
    supportsHelpText: true,
    supportsDefaultValue: true,
    requiredValidation: ["minLength", "maxLength"],
    exampleUseCase: "Comments, feedback, descriptions",
  },

  email: {
    type: "email",
    label: "Email",
    description: "Email address input with validation",
    icon: Mail,
    category: "Basic",
    defaultConfig: {
      placeholder: "name@example.com",
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: true,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Contact email, user registration",
  },

  phone: {
    type: "phone",
    label: "Phone Number",
    description: "Phone number input with formatting",
    icon: Phone,
    category: "Basic",
    defaultConfig: {
      placeholder: "+233 XX XXX XXXX",
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: true,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Contact number, emergency contact",
  },

  url: {
    type: "url",
    label: "URL",
    description: "Website URL input with validation",
    icon: Link,
    category: "Basic",
    defaultConfig: {
      placeholder: "https://example.com",
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: true,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Website, social media profile",
  },

  number: {
    type: "number",
    label: "Number",
    description: "Numeric input with optional range",
    icon: Hash,
    category: "Basic",
    defaultConfig: {
      placeholder: "0",
      validation: {
        min: 0,
      },
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: true,
    supportsHelpText: true,
    supportsDefaultValue: true,
    requiredValidation: ["min", "max"],
    exampleUseCase: "Age, quantity, score",
  },

  date: {
    type: "date",
    label: "Date",
    description: "Date picker for selecting dates",
    icon: Calendar,
    category: "Basic",
    defaultConfig: {},
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Birth date, event date, deadline",
  },

  select: {
    type: "select",
    label: "Dropdown",
    description: "Dropdown menu for selecting one option",
    icon: ChevronDown,
    category: "Choice",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option_1" },
        { label: "Option 2", value: "option_2" },
        { label: "Option 3", value: "option_3" },
      ],
    },
    supportsOptions: true,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Country, category, status",
  },

  radio: {
    type: "radio",
    label: "Radio Buttons",
    description: "Radio buttons for selecting one option",
    icon: Circle,
    category: "Choice",
    defaultConfig: {
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
      allowOther: false,
    },
    supportsOptions: true,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Yes/No, gender, preference",
  },

  checkbox: {
    type: "checkbox",
    label: "Checkboxes",
    description: "Checkboxes for selecting multiple options",
    icon: Square,
    category: "Choice",
    defaultConfig: {
      options: [
        { label: "Option 1", value: "option_1" },
        { label: "Option 2", value: "option_2" },
      ],
      allowOther: false,
    },
    supportsOptions: true,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Multi-select, interests, features",
  },

  range: {
    type: "range",
    label: "Range Slider",
    description: "Slider for selecting a numeric value",
    icon: Sliders,
    category: "Advanced",
    defaultConfig: {
      min: 0,
      max: 100,
      step: 1,
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Satisfaction level, priority, scale",
  },

  rating: {
    type: "rating",
    label: "Rating",
    description: "Star rating for quality or satisfaction",
    icon: Star,
    category: "Advanced",
    defaultConfig: {
      max: 5,
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Service rating, quality score",
  },

  color: {
    type: "color",
    label: "Color Picker",
    description: "Color selection input",
    icon: Palette,
    category: "Advanced",
    defaultConfig: {
      defaultValue: "#000000",
    },
    supportsOptions: false,
    supportsValidation: false,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: true,
    exampleUseCase: "Brand color, preference",
  },

  signature: {
    type: "signature",
    label: "Signature",
    description: "Digital signature pad for signing",
    icon: PenTool,
    category: "Advanced",
    defaultConfig: {},
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: false,
    exampleUseCase: "Consent, agreement, authorization",
  },

  gps: {
    type: "gps",
    label: "GPS Location",
    description: "Capture GPS coordinates automatically",
    icon: MapPin,
    category: "Location",
    defaultConfig: {},
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: false,
    exampleUseCase: "Site visit, inspection, check-in",
  },

  file: {
    type: "file",
    label: "File Upload",
    description: "Upload files (images, documents, etc.)",
    icon: Upload,
    category: "Media",
    defaultConfig: {
      accept: "image/*,application/pdf",
    },
    supportsOptions: false,
    supportsValidation: true,
    supportsPlaceholder: false,
    supportsHelpText: true,
    supportsDefaultValue: false,
    exampleUseCase: "Photo evidence, documents, receipts",
  },
}

/**
 * Get field config by type
 */
export function getFieldConfig(type: FormField["type"]): FieldTypeConfig {
  return FIELD_TYPE_CONFIGS[type]
}

/**
 * Get all field configs by category
 */
export function getFieldConfigsByCategory() {
  const categories: Record<string, FieldTypeConfig[]> = {}

  Object.values(FIELD_TYPE_CONFIGS).forEach((config) => {
    if (!categories[config.category]) {
      categories[config.category] = []
    }
    categories[config.category].push(config)
  })

  return categories
}

/**
 * Get field categories
 */
export function getFieldCategories(): string[] {
  return ["All", ...Object.keys(getFieldConfigsByCategory())]
}

/**
 * Search field configs
 */
export function searchFieldConfigs(query: string): FieldTypeConfig[] {
  const lowerQuery = query.toLowerCase()

  return Object.values(FIELD_TYPE_CONFIGS).filter(
    (config) =>
      config.label.toLowerCase().includes(lowerQuery) ||
      config.description.toLowerCase().includes(lowerQuery) ||
      config.category.toLowerCase().includes(lowerQuery) ||
      config.exampleUseCase.toLowerCase().includes(lowerQuery)
  )
}
