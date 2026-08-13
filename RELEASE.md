# Release 1.1.2

## Download

| File | Size |
|------|------|
| [cursor-rtl-1.1.2.vsix](https://github.com/Satan2049/cursor-rtl/releases/download/v1.1.2/cursor-rtl-1.1.2.vsix) | ~37 KB |

## Verify integrity

```powershell
Get-FileHash -Path cursor-rtl-1.1.2.vsix -Algorithm SHA256
```

Expected SHA256:

```
1FEFFE27E1E67AD4DA938817983ACDF527BB6CD81809F7BC0D1C7B27992F2C6D
```

## What's new in 1.1.2

- **Markdown source editor** — per-line RTL in Monaco: Hebrew, Arabic, and Persian lines align right; English lines stay left
- **Preview | Markdown** — RTL in Cursor's native TipTap/ProseMirror markdown editor (same CSS-based approach as Plan files)
- **Classic side preview** — RTL via `markdown.previewStyles` / `markdown.previewScripts`
- Immediate direction updates while typing (no left-then-right flash)
- Right-side inset on RTL markdown lines so text is not flush against the editor edge
- Code blocks and non-markdown files remain LTR

## Security scan

Build scanned clean on VirusTotal (0 detections):

https://www.virustotal.com/gui/file/1feffe27e1e67ad4da938817983acdf527bb6cd81809f7bc0d1c7b27992f2c6d

## Install

```powershell
cursor --install-extension cursor-rtl-1.1.2.vsix
```

Then run **Cursor RTL: Enable RTL Support** and fully restart Cursor (File → Exit, then reopen). Reload Window is not enough.
