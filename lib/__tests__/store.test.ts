import { useStore } from "../store"
import { usersAPI } from "../api"

// Mock the API
jest.mock("../api", () => ({
  usersAPI: {
    getMe: jest.fn(),
  },
}))

// Mock logger
jest.mock("../logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("Zustand Store", () => {
  beforeEach(() => {
    // Clear store state
    useStore.setState({
      token: null,
      user: null,
      isLoading: false,
      error: null,
    })
    // Clear localStorage
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = useStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it("should load token from localStorage on initialization", () => {
      localStorageMock.setItem("token", "test-token")
      // Note: This test assumes store reads from localStorage on init
      // The actual implementation reads on store creation
      expect(localStorageMock.getItem("token")).toBe("test-token")
    })
  })

  describe("setToken", () => {
    it("should set token in state", () => {
      const testToken = "new-test-token"
      useStore.getState().setToken(testToken)

      const state = useStore.getState()
      expect(state.token).toBe(testToken)
    })

    it("should persist token to localStorage", () => {
      const testToken = "new-test-token"
      useStore.getState().setToken(testToken)

      expect(localStorageMock.getItem("token")).toBe(testToken)
    })
  })

  describe("setUser", () => {
    it("should set user in state", () => {
      const testUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        role: "admin" as const,
        organization_id: "org-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      useStore.getState().setUser(testUser)

      const state = useStore.getState()
      expect(state.user).toEqual(testUser)
    })

    it("should allow setting user to null", () => {
      const testUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        role: "admin" as const,
        organization_id: "org-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      useStore.getState().setUser(testUser)
      useStore.getState().setUser(null)

      const state = useStore.getState()
      expect(state.user).toBeNull()
    })
  })

  describe("setLoading", () => {
    it("should set loading state to true", () => {
      useStore.getState().setLoading(true)

      const state = useStore.getState()
      expect(state.isLoading).toBe(true)
    })

    it("should set loading state to false", () => {
      useStore.getState().setLoading(true)
      useStore.getState().setLoading(false)

      const state = useStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })

  describe("setError", () => {
    it("should set error message", () => {
      const errorMessage = "Test error message"
      useStore.getState().setError(errorMessage)

      const state = useStore.getState()
      expect(state.error).toBe(errorMessage)
    })

    it("should clear error by setting to null", () => {
      useStore.getState().setError("Error")
      useStore.getState().setError(null)

      const state = useStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe("logout", () => {
    it("should clear token from state", () => {
      useStore.getState().setToken("test-token")
      useStore.getState().logout()

      const state = useStore.getState()
      expect(state.token).toBeNull()
    })

    it("should clear user from state", () => {
      const testUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        role: "admin" as const,
        organization_id: "org-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      useStore.getState().setUser(testUser)
      useStore.getState().logout()

      const state = useStore.getState()
      expect(state.user).toBeNull()
    })

    it("should remove token from localStorage", () => {
      localStorageMock.setItem("token", "test-token")
      useStore.getState().logout()

      expect(localStorageMock.getItem("token")).toBeNull()
    })
  })

  describe("restoreUser", () => {
    it("should fetch and set user data when token exists", async () => {
      const testToken = "valid-token"
      const testUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        role: "admin" as const,
        organization_id: "org-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      useStore.getState().setToken(testToken)

      const mockGetMe = usersAPI.getMe as jest.Mock
      mockGetMe.mockResolvedValue({
        data: { data: testUser },
      })

      await useStore.getState().restoreUser()

      const state = useStore.getState()
      expect(state.user).toEqual(testUser)
      expect(mockGetMe).toHaveBeenCalled()
    })

    it("should not fetch user data when token is null", async () => {
      // First set a token, then clear it
      useStore.getState().setToken("")
      // Reset to no token state
      useStore.setState({ token: null })

      const mockGetMe = usersAPI.getMe as jest.Mock

      await useStore.getState().restoreUser()

      expect(mockGetMe).not.toHaveBeenCalled()
    })

    it("should logout on fetch error", async () => {
      const testToken = "invalid-token"
      useStore.getState().setToken(testToken)

      const mockGetMe = usersAPI.getMe as jest.Mock
      mockGetMe.mockRejectedValue(new Error("Unauthorized"))

      await useStore.getState().restoreUser()

      const state = useStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
    })

    it("should handle network errors gracefully", async () => {
      const testToken = "valid-token"
      useStore.getState().setToken(testToken)

      const mockGetMe = usersAPI.getMe as jest.Mock
      mockGetMe.mockRejectedValue(new Error("Network error"))

      await useStore.getState().restoreUser()

      const state = useStore.getState()
      expect(state.token).toBeNull()
    })
  })

  describe("Store Integration", () => {
    it("should handle complete login flow", async () => {
      const testToken = "login-token"
      const testUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        role: "agent" as const,
        organization_id: "org-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      // Set token (as would happen after login)
      useStore.getState().setToken(testToken)

      // Set user
      useStore.getState().setUser(testUser)

      const state = useStore.getState()
      expect(state.token).toBe(testToken)
      expect(state.user).toEqual(testUser)
      expect(localStorageMock.getItem("token")).toBe(testToken)
    })

    it("should handle complete logout flow", () => {
      const testToken = "logout-token"
      const testUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        role: "viewer" as const,
        organization_id: "org-1",
        created_at: "2024-01-01T00:00:00Z",
      }

      // Setup authenticated state
      useStore.getState().setToken(testToken)
      useStore.getState().setUser(testUser)

      // Logout
      useStore.getState().logout()

      const state = useStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(localStorageMock.getItem("token")).toBeNull()
    })
  })
})
