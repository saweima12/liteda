# PWA Icons Setup

This directory requires PWA icons for the application to be installable.

## Required Icons

You need to create the following icon files:

- `icon-192.png` - 192x192 pixels (required for Android)
- `icon-512.png` - 512x512 pixels (required for Android)
- `favicon.png` - 32x32 or 64x64 pixels (browser favicon)

## Option 1: Use Existing Logo

If you have a logo in `images/` directory, you can use an image conversion tool:

```bash
# Using ImageMagick
convert images/logo.png -resize 192x192 static/icon-192.png
convert images/logo.png -resize 512x512 static/icon-512.png
convert images/logo.png -resize 32x32 static/favicon.png
```

## Option 2: Create from SVG Template

Use the `icon-template.svg` file in this directory as a base:

```bash
# Using Inkscape or any SVG to PNG converter
inkscape icon-template.svg -w 192 -h 192 -o icon-192.png
inkscape icon-template.svg -w 512 -h 512 -o icon-512.png
inkscape icon-template.svg -w 32 -h 32 -o favicon.png
```

## Option 3: Use Online Tool

1. Go to https://realfavicongenerator.net/
2. Upload your logo/icon
3. Download the generated package
4. Extract `android-chrome-192x192.png` → rename to `icon-192.png`
5. Extract `android-chrome-512x512.png` → rename to `icon-512.png`
6. Extract `favicon-32x32.png` → rename to `favicon.png`

## Option 4: Simple Placeholder

For quick testing, you can use a solid color placeholder:

```bash
# Using ImageMagick
convert -size 192x192 xc:'#0a0a0a' -gravity center \
        -pointsize 72 -fill white -annotate +0+0 'L' \
        static/icon-192.png

convert -size 512x512 xc:'#0a0a0a' -gravity center \
        -pointsize 200 -fill white -annotate +0+0 'L' \
        static/icon-512.png

convert -size 32x32 xc:'#0a0a0a' -gravity center \
        -pointsize 20 -fill white -annotate +0+0 'L' \
        static/favicon.png
```

## Design Guidelines

- Use a simple, recognizable design
- Ensure good contrast for visibility
- Avoid text if possible (doesn't scale well)
- Use solid background or transparent PNG
- Test on both light and dark backgrounds
- Keep it consistent with your brand

## Testing

After adding icons, test PWA installation:

1. Open browser DevTools
2. Go to "Application" → "Manifest"
3. Check that all icons are loaded
4. Try "Add to Home Screen" on mobile
