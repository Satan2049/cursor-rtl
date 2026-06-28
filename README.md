# Cursor RTL Chat

Smart multi-language **Right-to-Left (RTL)** support for the **Cursor IDE** chat panel. Hebrew, Arabic, and Persian text is automatically right-aligned while English and code blocks stay left-to-right.

![Extension icon](resources/icon.png)

## Features

- **Smart direction detection** — analyzes each chat message and applies `dir="rtl"` or `dir="ltr"` per element
- **Mixed-language support** — Hebrew/Arabic/Persian paragraphs align right; English-heavy content stays left
- **Code-safe** — code blocks, terminals, tool calls, and UI controls remain LTR
- **Plan editor support** — RTL works in Cursor Plan markdown views
- **Status bar indicator** — click to enable, disable, or check status
- **Auto-reapply** — restores the patch automatically after Cursor updates (configurable)

## Requirements

- [Cursor IDE](https://cursor.com) (not VS Code)
- Windows, macOS, or Linux

## Installation

### From GitHub Release (recommended)

1. Download [`cursor-rtl-1.0.1.vsix`](https://github.com/Satan2049/cursor-rtl/releases/download/v1.0.1/cursor-rtl-1.0.1.vsix) from [Releases](https://github.com/Satan2049/cursor-rtl/releases)
2. Verify SHA256 (see [checksums.sha256](checksums.sha256))
3. Install:

```powershell
cursor --install-extension cursor-rtl-1.0.1.vsix
```

Or press **Ctrl+Shift+P** → **Extensions: Install from VSIX...** → select the file.

### From Open VSX

Search **Cursor RTL Chat** in Cursor Extensions (after publishing to [Open VSX](https://open-vsx.org)).

### From source

```bash
git clone https://github.com/Satan2049/cursor-rtl.git
cd cursor-rtl
npm install
npm run release:prepare
```

Press **F5** in Cursor for development, or install the generated `.vsix`.

## Usage

1. **Ctrl+Shift+P** → **Cursor RTL: Enable RTL Support**
2. Confirm the patch dialog
3. **Fully quit Cursor** (File → Exit) and reopen
4. Open chat — RTL text aligns automatically

### Status bar

| Indicator | Meaning |
|-----------|---------|
| `RTL: ON` | Patch is active |
| `RTL: OFF` | Patch not applied — click to enable |
| `RTL: UPDATE NEEDED` | Cursor was updated — click to re-apply |

### Commands

| Command | Action |
|---------|--------|
| `Cursor RTL: Enable RTL Support` | Apply the RTL patch |
| `Cursor RTL: Disable RTL Support` | Restore original Cursor files |
| `Cursor RTL: Re-apply After Update` | Re-apply after a Cursor upgrade |
| `Cursor RTL: Check Status` | Show patch status in Output panel |
| `Cursor RTL: Toggle RTL Support` | Enable or disable |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `cursorRtl.autoReapply` | `true` | Auto-reapply patch when Cursor updates overwrite `main.js` |
| `cursorRtl.showStatusBar` | `true` | Show RTL status in the status bar |

## Security

Verify downloads with SHA256:

```powershell
Get-FileHash -Path cursor-rtl-1.0.1.vsix -Algorithm SHA256
```

Expected hash for v1.0.1:

```
289E2A32B748983DAD716EEFCC0A53B931DC57EE56025D0998CAFDAB538753CB
```

Official checksums: [checksums.sha256](checksums.sha256)

Pre-release build scanned clean on VirusTotal (0 detections):

https://www.virustotal.com/gui/file/fa7f00cc49ddb862dd68887dcc9b46d79aa4fd202fb6fd9f16aa39b3e67ff1ca

## How it works

This extension patches Cursor's `main.js` to load a small Electron loader. The loader injects a runtime script (`rtl.js`) into the workbench that:

1. Watches the chat DOM for new messages
2. Scores RTL vs LTR characters per text block
3. Applies `direction: rtl` / `text-align: start` to matching elements
4. Keeps code blocks, Monaco editors, and tool UI in LTR

Original `main.js` is backed up before patching. Disabling restores from backup.

> **Note:** Cursor may show an `[Unsupported]` warning because the patch modifies internal app files. This is expected for workbench-level RTL injection.

## Troubleshooting

**Changes not visible after enabling**
- Fully quit Cursor (not just Reload Window) and reopen
- Check **Output → Cursor RTL** for errors

**Permission denied**
- Windows: run Cursor as Administrator
- macOS: `sudo chown -R $USER Cursor.app/Contents/Resources/app/out/`

**RTL stopped after Cursor update**
- Click the status bar warning, or run **Re-apply After Update**
- Enable `cursorRtl.autoReapply` for automatic restoration

**Debug log**
- Loader writes to `~/cursor-rtl.log`

## Uninstall

Uninstalling the extension runs a cleanup script that restores `main.js` from backup if the patch is still active.

## Third-party components

The RTL runtime script (`resources/rtl.js`) is adapted from [cursor-ext-rtl](https://github.com/motcke/cursor-ext-rtl) (Apache-2.0). See [THIRD_PARTY.md](THIRD_PARTY.md).

## License

MIT — see [LICENSE](LICENSE).
