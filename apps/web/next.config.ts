import path from "node:path"

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  allowedDevOrigins: ["lighthouse.local"],
}
