# Release 1.0.1

## Download

| File | Size |
|------|------|
| [cursor-rtl-1.0.1.vsix](https://github.com/Satan2049/cursor-rtl/releases/download/v1.0.1/cursor-rtl-1.0.1.vsix) | ~34 KB |

## Verify integrity

```powershell
Get-FileHash -Path cursor-rtl-1.0.1.vsix -Algorithm SHA256
```

Expected SHA256:

```
289E2A32B748983DAD716EEFCC0A53B931DC57EE56025D0998CAFDAB538753CB
```

## What's fixed in 1.0.1

- RTL now works in **Agent chat** messages (not only Composer input)
- Clean icon without embedded letters

## Security scan

Pre-release build scanned clean on VirusTotal (0 detections):

https://www.virustotal.com/gui/file/fa7f00cc49ddb862dd68887dcc9b46d79aa4fd202fb6fd9f16aa39b3e67ff1ca

> Re-upload `cursor-rtl-1.0.1.vsix` to VirusTotal after release and update this link.

## Install

```powershell
cursor --install-extension cursor-rtl-1.0.1.vsix
```

Then run **Cursor RTL: Enable RTL Support** and fully restart Cursor.
