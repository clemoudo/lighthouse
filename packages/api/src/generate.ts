import { generateOpenAPI } from "./openapi"
import fs from "node:fs"
import path from "node:path"

function run() {
  console.log("⏳ Generating OpenAPI spec...")
  try {
    const spec = generateOpenAPI()
    const outputPath = path.resolve(process.cwd(), "openapi.json")

    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2))

    console.log(`✅ OpenAPI spec updated at ${new Date().toLocaleTimeString()}`)
  } catch (error) {
    console.error("❌ Failed to generate OpenAPI spec:", error)
  }
}

run()
