# Change Log

All notable changes to the "cursor-rtl" extension will be documented in this file.

## [1.0.2] - 2026-06-26

### Fixed

- Composer placeholder no longer clipped on the right when input is empty (LTR)
- Placeholder only moves to the right when typing RTL text

## [1.0.1] - 2026-06-26

### Fixed

- RTL now applies to Agent chat messages (not only Composer input)
- Added support for `.markdown-root > div` streaming containers and `.composer-human-message-content`
- Fixed Hebrew word order during streaming (`data-streamdown` spans)
- Clean icon without embedded letters

## [1.0.0] - 2026-06-26

### Added

- Smart per-element RTL detection for Cursor AI Chat (Hebrew, Arabic, Persian)
- Enable / disable / re-apply / status commands
- Status bar indicator with click-to-manage
- Auto-reapply after Cursor updates (`cursorRtl.autoReapply`)
- Output channel for diagnostics
- Uninstall cleanup script
- Plan editor and mixed-language support via rtl.js runtime
