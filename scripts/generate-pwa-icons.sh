#!/bin/bash
# Generate PWA icons from SVG template
# Requires: ImageMagick or Inkscape

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STATIC_DIR="$PROJECT_ROOT/static"
TEMPLATE="$STATIC_DIR/icon-template.svg"

echo "🎨 Generating PWA icons for Liteda..."

# Check if template exists
if [ ! -f "$TEMPLATE" ]; then
  echo "❌ Error: icon-template.svg not found in static/"
  exit 1
fi

# Try Inkscape first (better quality)
if command -v inkscape &> /dev/null; then
  echo "✓ Using Inkscape"

  inkscape "$TEMPLATE" -w 192 -h 192 -o "$STATIC_DIR/icon-192.png"
  echo "✓ Generated icon-192.png"

  inkscape "$TEMPLATE" -w 512 -h 512 -o "$STATIC_DIR/icon-512.png"
  echo "✓ Generated icon-512.png"

  inkscape "$TEMPLATE" -w 32 -h 32 -o "$STATIC_DIR/favicon.png"
  echo "✓ Generated favicon.png"

# Fallback to ImageMagick
elif command -v convert &> /dev/null; then
  echo "✓ Using ImageMagick"

  convert -background none "$TEMPLATE" -resize 192x192 "$STATIC_DIR/icon-192.png"
  echo "✓ Generated icon-192.png"

  convert -background none "$TEMPLATE" -resize 512x512 "$STATIC_DIR/icon-512.png"
  echo "✓ Generated icon-512.png"

  convert -background none "$TEMPLATE" -resize 32x32 "$STATIC_DIR/favicon.png"
  echo "✓ Generated favicon.png"

else
  echo "❌ Error: Neither Inkscape nor ImageMagick found"
  echo ""
  echo "Please install one of the following:"
  echo "  - Inkscape: https://inkscape.org/"
  echo "  - ImageMagick: https://imagemagick.org/"
  echo ""
  echo "Or use an online tool: https://realfavicongenerator.net/"
  exit 1
fi

echo ""
echo "✅ PWA icons generated successfully!"
echo ""
echo "Files created:"
echo "  - $STATIC_DIR/icon-192.png"
echo "  - $STATIC_DIR/icon-512.png"
echo "  - $STATIC_DIR/favicon.png"
