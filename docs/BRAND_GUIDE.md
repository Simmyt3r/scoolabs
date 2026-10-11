# Scoolabs identity guide (proposed v1)

This product brand belongs to **Scoolabs**, an offline-first virtual science laboratory developed by **Simeon's Laboratories and Co Technologies Ltd**. This is an original Scoolabs identity, not a replacement or redraw of the separate Silabs corporate logo.

## The symbol and story
The Scoolabs emblem combines an **experimental flask** with an **open book**: scientific discovery supported by learning. A warm spark represents curiosity. It must remain legible as a tiny Windows taskbar icon, as an installer icon, and inside an application sidebar.

**Master source:** `public/brand/scoolabs-mark.svg`. All taskbar/installer PNG and ICO sizes are generated from this vector by the Tauri CLI at build time. Do **not** stretch the mark, add text to the app icon, or insert photographic imagery into the icon.

## Palette

| Role | Value | Application |
|---|---|---|
| Laboratory navy | `#102b40` | Main navigation, icon background |
| Deep navy | `#0b2034` | Window chrome and dark surfaces |
| Experiment teal | `#12bea7` | Main actions, flask fill, progress |
| Mint highlight | `#61e8d2` | Active interface and highlights |
| Discovery amber | `#ffc879` | Spark and selective learning accents |
| Laboratory paper | `#f5faf9` | Neutral learning surfaces |
| Ink | `#173449` | Body typography |
| White | `#ffffff` | Clear foreground and open-book emblem |

For subject recognition, Chemistry may use violet, Physics blue, Biology green and Agriculture warm orange, but these cues must not be the only way an activity is identified.

## Product voice
- Promise practical, offline learning, **not** official curriculum certification.
- Describe simulations as **educational models**. Do not imply that virtual outputs were measured with real calibrated instruments.
- Use short, actionable language. Favour "Start practical", "My assignments" and "Teacher setup" over slogans that hide the next action.
- Keep the company legal name in About/help/legal areas and report footers.
- No third-party educational accreditation is claimed.

## Icon pipeline
From the repository root after npm install:

```bash
npm run brand:icons
```

This invokes `tauri icon public/brand/scoolabs-mark.svg --output src-tauri/icons` and generates the required `icon.ico` and `icon.png`. CI runs this **before** packaging the NSIS installer. Generated binary files are build outputs and are intentionally not versioned; the source SVG is versioned instead. To reproduce the branded installer locally, use `npm run desktop:build`, not a bare `tauri build` command.

## Review before any public launch
- Confirm the Scoolabs wordmark and symbol with the product owner.
- Test the icon at 16px/32px and the Windows Start menu, taskbar and installer.
- Check contrast at 200% Windows text scaling and in high-contrast mode.
- Verify NSIS shows the Scoolabs icon; unsigned releases can still trigger Windows SmartScreen. Code signing is separate from visual branding.
- Do not publish a formal versioned release until the real Windows classroom acceptance checklist is completed.

## v0.9 candidate release status
The Windows bundle metadata now uses the official company name as publisher and sets the category to Education. The NSIS installer icon points to the Tauri-generated `icons/icon.ico`. These metadata fields do not provide a code-signing certificate or a verified publisher signature.
