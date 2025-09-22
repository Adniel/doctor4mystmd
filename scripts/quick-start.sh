#!/bin/bash

# Doctor4MySTMD Quick Start Script
# This script helps you get started quickly with Doctor4MySTMD

set -e

echo "🚀 Doctor4MySTMD Quick Start"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install MyST CLI locally
echo "📦 Installing MyST CLI locally..."
if npm install mystmd 2>/dev/null; then
    echo "✅ MyST CLI installed locally"
else
    echo "⚠️  Failed to install MyST CLI locally. You may need to check your npm configuration."
    echo "   Try: npm install mystmd"
fi

# Install Doctor locally
echo "📦 Installing Doctor locally..."
if npm install @estruyf/doctor 2>/dev/null; then
    echo "✅ Doctor installed locally"
else
    echo "⚠️  Failed to install Doctor locally. You may need to check your npm configuration."
    echo "   Try: npm install @estruyf/doctor"
fi

# Check if Doctor4MySTMD is built
if [ ! -d "dist" ]; then
    echo "📦 Building Doctor4MySTMD..."
    npm run build
    echo "✅ Doctor4MySTMD built"
else
    echo "✅ Doctor4MySTMD already built"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Create your project directory: mkdir my-project && cd my-project"
echo "2. Copy the sample project: cp -r ../examples/sample-project/* ."
echo "3. Configure SharePoint: doctor4mystmd config --site-url 'https://yourtenant.sharepoint.com/sites/your-site'"
echo "4. Test with dry run: doctor4mystmd publish-toc ./myst.yml --dry-run"
echo "5. Publish to SharePoint: doctor4mystmd publish-toc ./myst.yml"
echo ""
echo "For detailed instructions, see GETTING_STARTED.md"
echo ""
