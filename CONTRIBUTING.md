# Contributing

## Development

```bash
npm install
npm run watch    # rebuild on change
```

Press **F5** in Cursor to launch Extension Development Host.

## Release checklist

1. Bump `version` in `package.json` and update `CHANGELOG.md`
2. Run `npm run release:prepare`
3. Commit and tag:

```bash
git add .
git commit -m "Release v1.1.2"
git tag v1.1.2
git push origin main --tags
```

4. GitHub Actions attaches VSIX + `checksums.sha256` to the release
5. (Optional) Add `OVSX_PAT` secret in GitHub → Settings → Secrets for Open VSX auto-publish
6. Upload final VSIX to [VirusTotal](https://www.virustotal.com) and update `RELEASE.md` with the new link

## Open VSX (manual)

```bash
npx ovsx create-namespace cursor-rtl -p YOUR_TOKEN
npx ovsx publish cursor-rtl-1.1.2.vsix -p YOUR_TOKEN
```

Sign in at https://open-vsx.org with GitHub and create a token at https://open-vsx.org/user-settings/tokens
