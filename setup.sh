#!/bin/bash

# Go Game Setup Script
# This script installs all necessary packages and dependencies

set -e

echo "🚀 Setting up Go Game project..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js first:"
    echo "  - Visit https://nodejs.org/"
    echo "  - Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install Playwright browsers (for testing)
echo "🎭 Installing Playwright browsers..."
npx playwright install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev      - Start development server"
echo "  npm run build    - Build for production"
echo "  npm run preview  - Preview production build"
echo "  npm run test     - Run tests"
echo ""
echo "To get started:"
echo "  npm run dev"