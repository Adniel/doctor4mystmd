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

# Install MyST CLI if not already installed
if ! command -v mystmd &> /dev/null; then
    echo "📦 Installing MyST CLI..."
    if npm install -g mystmd 2>/dev/null; then
        echo "✅ MyST CLI installed"
    else
        echo "⚠️  Failed to install MyST CLI globally. You may need to run with sudo or use a different approach."
        echo "   Try: sudo npm install -g mystmd"
        echo "   Or: npm install mystmd (local installation)"
    fi
else
    echo "✅ MyST CLI found: $(mystmd --version)"
fi

# Install Doctor if not already installed
if ! command -v doctor &> /dev/null; then
    echo "📦 Installing Doctor..."
    if npm install -g @estruyf/doctor 2>/dev/null; then
        echo "✅ Doctor installed"
    else
        echo "⚠️  Failed to install Doctor globally. You may need to run with sudo or use a different approach."
        echo "   Try: sudo npm install -g @estruyf/doctor"
        echo "   Or: npm install @estruyf/doctor (local installation)"
    fi
else
    echo "✅ Doctor found: $(doctor --version)"
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
