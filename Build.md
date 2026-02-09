# Building & Releasing adk-tui

## Local Development

Run in development mode (hot reload):

```bash
bun run dev
```

## Local Build

Build a standalone binary for your current platform:

```bash
bun run build
```

This produces an `adk-tui` executable in the project root.

You can also build for a specific platform:

```bash
bun run build.ts --target bun-linux-x64 --outfile adk-tui-linux-x64
```

## Creating a Release

Releases are automated via GitHub Actions. Pushing a version tag triggers the pipeline, which builds binaries for all platforms and publishes a GitHub Release.

### Steps

1. Update the version in `package.json`
2. Commit the change
3. Tag and push:

```bash
git tag v0.1.0
git push origin main --tags
```

To test with a pre-release first:

```bash
git tag v0.1.0-rc.1
git push origin main --tags
```

Tags containing `-` (e.g. `v0.1.0-rc.1`, `v0.1.0-beta.2`) are automatically marked as pre-releases on GitHub.

### What Happens

The workflow (`.github/workflows/release.yml`) runs two jobs:

**Build** — 5 parallel jobs on native runners:

| Platform | Runner | Binary |
|----------|--------|--------|
| Linux x64 | `ubuntu-latest` | `adk-tui-linux-x64` |
| Linux ARM64 | `ubuntu-24.04-arm` | `adk-tui-linux-arm64` |
| macOS x64 | `macos-13` | `adk-tui-darwin-x64` |
| macOS ARM64 (Apple Silicon) | `macos-14` | `adk-tui-darwin-arm64` |
| Windows x64 | `windows-latest` | `adk-tui-windows-x64.exe` |

Each job installs Bun, runs `bun install --frozen-lockfile`, and compiles the binary using `Bun.build()` with the `compile` option.

**Release** — After all builds succeed:

1. Downloads all 5 binaries
2. Generates a `checksums-sha256.txt` file
3. Creates a GitHub Release with auto-generated release notes
4. Attaches all binaries and the checksums file

### Verifying a Download

Users can verify binary integrity using the checksums file:

```bash
sha256sum --check checksums-sha256.txt
```
