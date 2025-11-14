#!/usr/bin/env node

/**
 * Test RBAC API Endpoints
 *
 * Usage:
 * 1. Get your token from browser console:
 *    JSON.parse(localStorage.getItem('login_data'))?.token
 *
 * 2. Run this script:
 *    TOKEN="your_token_here" node test-rbac-endpoints.js
 */

const http = require("http")

const API_BASE = "http://localhost:8000"
const TOKEN = process.env.TOKEN

if (!TOKEN) {
  console.error("❌ ERROR: No token provided")
  console.error("")
  console.error("Usage:")
  console.error('  TOKEN="your_token_here" node test-rbac-endpoints.js')
  console.error("")
  console.error("Get your token from browser console:")
  console.error("  JSON.parse(localStorage.getItem('login_data'))?.token")
  process.exit(1)
}

const endpoints = [
  { name: "Roles (/rbac/roles)", path: "/rbac/roles" },
  { name: "Permissions (/rbac/permissions)", path: "/rbac/permissions" },
  { name: "Roles (/v1/rbac/roles)", path: "/v1/rbac/roles" },
  { name: "Permissions (/v1/rbac/permissions)", path: "/v1/rbac/permissions" },
]

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 8000,
      path: endpoint.path,
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }

    const req = http.request(options, (res) => {
      let data = ""

      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ endpoint, status: res.statusCode, data: parsed })
        } catch (e) {
          resolve({ endpoint, status: res.statusCode, error: "Invalid JSON", raw: data })
        }
      })
    })

    req.on("error", (error) => {
      resolve({ endpoint, error: error.message })
    })

    req.end()
  })
}

async function main() {
  console.log("🧪 Testing RBAC API Endpoints...\n")
  console.log(`Token: ${TOKEN.substring(0, 20)}...${TOKEN.substring(TOKEN.length - 10)}\n`)

  for (const endpoint of endpoints) {
    console.log(`\n${"=".repeat(80)}`)
    console.log(`Testing: ${endpoint.name}`)
    console.log(`Path: ${endpoint.path}`)
    console.log("=".repeat(80))

    const result = await testEndpoint(endpoint)

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`)
      continue
    }

    console.log(`✅ Status: ${result.status}`)
    console.log("\n📦 Response Structure:")
    console.log(JSON.stringify(result.data, null, 2))

    // Analyze structure
    console.log("\n🔍 Analysis:")
    if (result.data) {
      console.log(`  - Type: ${Array.isArray(result.data) ? "Array" : "Object"}`)

      if (Array.isArray(result.data)) {
        console.log(`  - Array length: ${result.data.length}`)
        if (result.data.length > 0) {
          console.log(`  - First item keys: ${Object.keys(result.data[0]).join(", ")}`)
        }
      } else {
        console.log(`  - Object keys: ${Object.keys(result.data).join(", ")}`)

        if (result.data.data !== undefined) {
          console.log(
            `  - Has 'data' property: ${Array.isArray(result.data.data) ? "Array" : typeof result.data.data}`
          )
          if (Array.isArray(result.data.data)) {
            console.log(`  - data.length: ${result.data.data.length}`)
            if (result.data.data.length > 0) {
              console.log(`  - First item in data: ${Object.keys(result.data.data[0]).join(", ")}`)
            }
          }
        }

        if (result.data.success !== undefined) {
          console.log(`  - Has 'success' property: ${result.data.success}`)
        }
      }
    }
  }

  console.log("\n\n" + "=".repeat(80))
  console.log("🎯 SUMMARY")
  console.log("=".repeat(80))
  console.log("\nBased on the responses above, the frontend should expect:")
  console.log("1. Check which endpoints return 200 status")
  console.log("2. Identify the response structure (direct array vs wrapped object)")
  console.log("3. Confirm the location of the actual data array")
}

main().catch(console.error)
