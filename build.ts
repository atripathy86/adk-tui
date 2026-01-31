#!/usr/bin/env bun

import solidPlugin from "./scripts/solid-plugin"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.chdir(__dirname)

import pkg from "./package.json"

const result = await Bun.build({
  conditions: ["browser"],
  plugins: [solidPlugin],
  sourcemap: "external",
  compile: {
    autoloadBunfig: false,
    autoloadDotenv: false,
    //@ts-ignore (bun types aren't up to date)
    autoloadTsconfig: true,
    autoloadPackageJson: true,
    target: `bun-${process.platform}-${process.arch}` as any,
    outfile: "adk-tui",
  },
  entrypoints: ["./src/index.tsx"],
  define: {
    ADK_TUI_VERSION: `'${pkg.version}'`,
  },
})

if (!result.success) {
  console.error("Build failed:")
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log("Build successful!")
