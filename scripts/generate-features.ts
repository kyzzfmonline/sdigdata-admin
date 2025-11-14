#!/usr/bin/env tsx
/**
 * Feature Generator Script
 * Automatically generates hooks, components, and pages for all backend features
 *
 * Usage: pnpm tsx scripts/generate-features.ts
 */

import fs from "fs"
import path from "path"

const FEATURES = [
  {
    name: "sessions",
    endpoints: [
      { method: "GET", path: "/users/me/sessions", hook: "useSessions" },
      { method: "GET", path: "/users/me/sessions/{id}", hook: "useSession" },
      { method: "DELETE", path: "/users/me/sessions/{id}", hook: "useRevokeSession" },
      { method: "DELETE", path: "/users/me/sessions", hook: "useRevokeAllSessions" },
      { method: "GET", path: "/users/me/sessions/stats/overview", hook: "useSessionStats" },
      {
        method: "GET",
        path: "/users/me/sessions/security/suspicious",
        hook: "useSuspiciousSessions",
      },
    ],
  },
  {
    name: "api-keys",
    endpoints: [
      { method: "GET", path: "/users/me/api-keys", hook: "useAPIKeys" },
      { method: "POST", path: "/users/me/api-keys", hook: "useCreateAPIKey" },
      { method: "GET", path: "/users/me/api-keys/{id}", hook: "useAPIKey" },
      { method: "PUT", path: "/users/me/api-keys/{id}", hook: "useUpdateAPIKey" },
      { method: "DELETE", path: "/users/me/api-keys/{id}", hook: "useRevokeAPIKey" },
      { method: "POST", path: "/users/me/api-keys/{id}/rotate", hook: "useRotateAPIKey" },
      { method: "GET", path: "/users/me/api-keys/{id}/usage", hook: "useAPIKeyUsage" },
      { method: "GET", path: "/users/me/api-keys/stats/overview", hook: "useAPIKeyStats" },
    ],
  },
  // Add more features here...
]

function generateHook(feature: (typeof FEATURES)[0]) {
  const hookContent = `/**
 * ${feature.name.charAt(0).toUpperCase() + feature.name.slice(1)} Hooks
 * React Query hooks for ${feature.name}
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { toast } from "sonner";

// TODO: Add proper TypeScript types

${feature.endpoints
  .map((endpoint) => {
    if (endpoint.method === "GET") {
      return `export function ${endpoint.hook}(${endpoint.path.includes("{id}") ? "id: string | undefined" : ""}) {
  return useQuery({
    queryKey: ${endpoint.path.includes("{id}") ? `id ? ["${feature.name}", id] : []` : `["${feature.name}"]`},
    queryFn: async () => {
      ${endpoint.path.includes("{id}") ? 'if (!id) throw new Error("ID is required");' : ""}
      const response = await apiClient.get(\`${endpoint.path.replace("{id}", "${id}")}\`);
      return response.data.data;
    },
    ${endpoint.path.includes("{id}") ? "enabled: !!id," : ""}
  });
}`
    } else {
      return `export function ${endpoint.hook}(${endpoint.path.includes("{id}") ? "id: string" : ""}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (${endpoint.method !== "DELETE" ? "data: any" : ""}) => {
      const response = await apiClient.${endpoint.method.toLowerCase()}(\`${endpoint.path.replace("{id}", "${id}")}\`${endpoint.method !== "DELETE" ? ", data" : ""});
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["${feature.name}"] });
      toast.success("Operation successful");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });
}`
    }
  })
  .join("\n\n")}
`

  const hookPath = path.join(process.cwd(), `hooks/${feature.name}/use-${feature.name}.ts`)
  fs.mkdirSync(path.dirname(hookPath), { recursive: true })
  fs.writeFileSync(hookPath, hookContent)
  console.log(`✅ Generated: ${hookPath}`)
}

function generatePage(feature: (typeof FEATURES)[0]) {
  const pageContent = `"use client";

/**
 * ${feature.name.charAt(0).toUpperCase() + feature.name.slice(1)} Management Page
 */

import { useState } from "react";
import { LayoutWrapper } from "@/components/layout-wrapper";

export default function ${feature.name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")}Page() {
  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            ${feature.name
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </h1>
          <p className="text-muted-foreground">
            Manage your ${feature.name.replace("-", " ")}
          </p>
        </div>

        {/* TODO: Implement ${feature.name} UI */}
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            ${feature.name} management interface coming soon...
          </p>
        </div>
      </div>
    </LayoutWrapper>
  );
}
`

  const pagePath = path.join(process.cwd(), `app/settings/${feature.name}/page.tsx`)
  fs.mkdirSync(path.dirname(pagePath), { recursive: true })
  fs.writeFileSync(pagePath, pageContent)
  console.log(`✅ Generated: ${pagePath}`)
}

// Main execution
console.log("🚀 Generating features...\n")

FEATURES.forEach((feature) => {
  console.log(`\n📦 Generating ${feature.name}...`)
  generateHook(feature)
  generatePage(feature)
})

console.log("\n✨ Feature generation complete!\n")
console.log("Next steps:")
console.log("1. Review generated files")
console.log("2. Add proper TypeScript types")
console.log("3. Implement UI components")
console.log("4. Add tests")
