#!/bin/bash
# Build and deploy script - ensures CSS is always included
cd /home/ubuntu/iraqairways

# Build
npx vite build 2>&1 | tail -3

# Get new filenames
NEW_JS=$(cat dist/app.html | grep -oP 'app-[^"]+\.js')
NEW_CSS=$(cat dist/app.html | grep -oP 'app-[^"]+\.css')

# Get old filenames from HTML
OLD_JS=$(grep -oP 'app-[^"]+\.js' client/public/flight-search.html | head -1)
OLD_CSS=$(grep -oP 'app-[^"]+\.css' client/public/flight-search.html | head -1)

echo "JS: $OLD_JS -> $NEW_JS"
echo "CSS: $OLD_CSS -> $NEW_CSS"

# Copy new files
cp "dist/assets/$NEW_JS" client/public/assets/
cp "dist/assets/$NEW_CSS" client/public/assets/

# Update all HTML references
find client/public -name "*.html" -exec sed -i "s/$OLD_JS/$NEW_JS/g" {} +
find client/public -name "*.html" -exec sed -i "s/$OLD_CSS/$NEW_CSS/g" {} +

# Remove old files (only if different)
[ "$OLD_JS" != "$NEW_JS" ] && rm -f "client/public/assets/$OLD_JS"
[ "$OLD_CSS" != "$NEW_CSS" ] && rm -f "client/public/assets/$OLD_CSS"

# Verify CSS exists
if [ ! -f "client/public/assets/$NEW_CSS" ]; then
  echo "ERROR: CSS file missing!"
  exit 1
fi

echo "✅ Build complete. JS: $NEW_JS | CSS: $NEW_CSS"

# Git push
git add -A && git commit -m "$1" && git push origin main
