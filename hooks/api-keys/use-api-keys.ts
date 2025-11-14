/**
 * API Keys Management Hooks
 * React Query hooks for managing API keys
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface APIKey {
  id: string
  name: string
  key_prefix: string
  description?: string
  scopes: string[]
  expires_at?: string
  last_used_at?: string
  usage_count: number
  is_active: boolean
  is_revoked: boolean
  created_at: string
  updated_at?: string
}

export interface APIKeyCreate {
  name: string
  description?: string
  scopes?: string[]
  expires_at?: string
}

export interface APIKeyUpdate {
  name?: string
  description?: string
  scopes?: string[]
  is_active?: boolean
}

export interface APIKeyWithSecret extends APIKey {
  key: string // Full key only returned on creation
}

export interface APIKeyStats {
  total_keys: number
  active_keys: number
  revoked_keys: number
  expired_keys: number
  total_usage: number
  keys_by_scope: Record<string, number>
}

export interface APIKeyUsage {
  date: string
  count: number
  success_count: number
  error_count: number
}

// List my API keys
export function useAPIKeys(includeRevoked: boolean = false) {
  return useQuery({
    queryKey: queryKeys.apiKeys.list(includeRevoked),
    queryFn: async () => {
      const response = await apiClient.get("/users/me/api-keys", {
        params: { include_revoked: includeRevoked },
      })
      return response.data.data as APIKey[]
    },
  })
}

// Get single API key
export function useAPIKey(keyId: string | undefined) {
  return useQuery({
    queryKey: keyId ? queryKeys.apiKeys.detail(keyId) : [],
    queryFn: async () => {
      if (!keyId) throw new Error("API key ID is required")
      const response = await apiClient.get(`/users/me/api-keys/${keyId}`)
      return response.data.data as APIKey
    },
    enabled: !!keyId,
  })
}

// Get API key statistics
export function useAPIKeyStats() {
  return useQuery({
    queryKey: queryKeys.apiKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get("/users/me/api-keys/stats/overview")
      return response.data.data as APIKeyStats
    },
  })
}

// Get API key usage history
export function useAPIKeyUsage(keyId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: keyId ? queryKeys.apiKeys.usage(keyId, days) : [],
    queryFn: async () => {
      if (!keyId) throw new Error("API key ID is required")
      const response = await apiClient.get(`/users/me/api-keys/${keyId}/usage`, {
        params: { days },
      })
      return response.data.data as APIKeyUsage[]
    },
    enabled: !!keyId,
  })
}

// Create API key mutation
export function useCreateAPIKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: APIKeyCreate) => {
      const response = await apiClient.post("/users/me/api-keys", data)
      return response.data.data as APIKeyWithSecret
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.my() })
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.stats() })
      toast.success("API key created successfully. Make sure to save it - you won't see it again!")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create API key")
    },
  })
}

// Update API key mutation
export function useUpdateAPIKey(keyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: APIKeyUpdate) => {
      const response = await apiClient.put(`/users/me/api-keys/${keyId}`, data)
      return response.data.data as APIKey
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.detail(keyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.my() })
      toast.success("API key updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update API key")
    },
  })
}

// Revoke API key mutation
export function useRevokeAPIKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (keyId: string) => {
      await apiClient.delete(`/users/me/api-keys/${keyId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.my() })
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.stats() })
      toast.success("API key revoked successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke API key")
    },
  })
}

// Rotate API key mutation (creates new key with same config, revokes old one)
export function useRotateAPIKey(keyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/users/me/api-keys/${keyId}/rotate`)
      return response.data.data as APIKeyWithSecret
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.detail(keyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.my() })
      toast.success("API key rotated successfully. Save the new key!")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to rotate API key")
    },
  })
}

// Activate/deactivate API key
export function useToggleAPIKey(keyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const response = await apiClient.put(`/users/me/api-keys/${keyId}`, {
        is_active: isActive,
      })
      return response.data.data as APIKey
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.detail(keyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.my() })
      toast.success(data.is_active ? "API key activated" : "API key deactivated")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to toggle API key")
    },
  })
}

// Test API key
export function useTestAPIKey() {
  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiClient.post(`/users/me/api-keys/${keyId}/test`)
      return response.data.data
    },
    onSuccess: () => {
      toast.success("API key is valid and working")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "API key test failed")
    },
  })
}

// Get expiring API keys
export function useExpiringAPIKeys(days: number = 7) {
  return useQuery({
    queryKey: ["api-keys", "expiring", days],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/api-keys/expiring", {
        params: { days },
      })
      return response.data.data as APIKey[]
    },
  })
}
