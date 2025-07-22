#!/bin/bash

# Startup script for the 3D Go webapp
# Checks for dependencies and starts the development server

echo "🚀 Starting 3D Go webapp..."

# Check if node_modules exists and has content
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "📦 node_modules not found or empty. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Check if package-lock.json is newer than node_modules (dependencies might be outdated)
if [ "package-lock.json" -nt "node_modules" ]; then
    echo "📦 Dependencies may be outdated. Running npm install..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to update dependencies"
        exit 1
    fi
    echo "✅ Dependencies updated successfully"
fi

echo "🌐 Starting development server..."
npm run dev