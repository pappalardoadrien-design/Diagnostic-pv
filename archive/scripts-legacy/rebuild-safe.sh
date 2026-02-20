#!/bin/bash
# Safe rebuild qui préserve la DB D1 locale

echo "🧹 Cleaning build artifacts (preserving DB)..."
rm -rf dist
rm -rf .wrangler/tmp
# Ne PAS supprimer .wrangler/state (contient DB D1)

echo "🔨 Building..."
npm run build

echo "✅ Build complete! DB preserved in .wrangler/state"
