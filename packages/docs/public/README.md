# Public Assets for VitePress Docs

This directory contains public assets that are served by VitePress.

## Required Files

Place the following files in this directory:

1. **favicon.png** - Website favicon (32x32 or 64x64 PNG)
   - Copy from: `../../design/favicon.png` (if available)
   - Or create a favicon from the logo

2. **logo-horizontal-dev.png** - Header logo for docs site
   - Copy from: `../../design/logo-horizontal-dev.png`
   - Should be around 200x60 pixels for best display

## Setup Instructions

```bash
# Copy logo to public folder (from project root)
cp design/logo-horizontal-dev.png packages/docs/public/

# Create favicon from the logo or add favicon.png
cp design/favicon.png packages/docs/public/
```

If favicon.png doesn't exist in the design folder, you can:
- Use the logo-icon.png and rename it
- Generate a favicon online from the logo
- Or use any 32x32 PNG icon
