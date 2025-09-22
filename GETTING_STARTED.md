# Getting Started with Doctor4MySTMD

This guide will walk you through the complete process of setting up and publishing a MyST document project to SharePoint using Doctor4MySTMD.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **MyST CLI** (`mystmd`)
- **Doctor** (SharePoint publishing tool)
- **Access to a SharePoint site** with appropriate permissions

## Step 1: Install Prerequisites

### Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/) if you haven't already.

### Install MyST CLI
```bash
npm install -g mystmd
```

### Install Doctor
```bash
npm install -g @estruyf/doctor
```

### Install Doctor4MySTMD
```bash
# Clone the repository
git clone <repository-url>
cd doctor4mystmd

# Install dependencies
npm install

# Build the project
npm run build

# Install globally (optional)
npm install -g .
```

## Step 2: Set Up Your MyST Project

### Create Project Directory
```bash
mkdir my-myst-project
cd my-myst-project
```

### Create myst.yml Configuration
Create a `myst.yml` file in your project root:

```yaml
version: 1

project:
  title: "My Documentation Site"
  description: "A sample MyST documentation site"
  authors:
    - "Your Name"
  keywords:
    - "documentation"
    - "myst"
    - "sharepoint"
  
  toc:
    - file: index.md
      title: "Home"
    - file: getting-started.md
      title: "Getting Started"
    - title: "User Guide"
      children:
        - file: user-guide/introduction.md
          title: "Introduction"
        - file: user-guide/installation.md
          title: "Installation"
        - file: user-guide/usage.md
          title: "Usage"
    - file: api-reference.md
      title: "API Reference"

site:
  title: "My Documentation"
  description: "Complete documentation for my project"
  url: "https://yourtenant.sharepoint.com/sites/my-docs"
```

### Create Content Files

#### Create index.md
```markdown
---
title: "Welcome to My Documentation"
authors:
  - name: "Your Name"
    email: "your.email@example.com"
date: "2024-01-15"
description: "Welcome page for my documentation site"
keywords: ["documentation", "getting started"]
status: "published"
---

# Welcome to My Documentation

This is the home page of my documentation site.

## Quick Start

- [Getting Started](getting-started) - Learn the basics
- [User Guide](user-guide/introduction) - Comprehensive guide
- [API Reference](api-reference) - Technical documentation

## Features

- **Structured Content**: Organized using MyST's table of contents
- **Cross-References**: Links between pages using {ref}`getting-started`
- **Navigation**: Automatic navigation generation
- **SharePoint Integration**: Seamless publishing to SharePoint
```

#### Create getting-started.md
```markdown
---
title: "Getting Started"
authors:
  - name: "Your Name"
    email: "your.email@example.com"
date: "2024-01-15"
description: "A quick start guide for new users"
keywords: ["getting started", "tutorial", "basics"]
tags: ["tutorial", "beginner"]
status: "published"
---

# Getting Started

Welcome to our documentation! This guide will help you get up and running quickly.

## What You'll Learn

In this guide, you'll learn:

1. How to set up your environment
2. Basic concepts and terminology
3. How to use the main features
4. Next steps for advanced usage

## Prerequisites

Before you begin, make sure you have:

- Basic understanding of Markdown
- Access to our platform
- A text editor or IDE

## Quick Setup

Follow these steps to get started:

1. **Create an account** on our platform
2. **Verify your email** address
3. **Complete your profile** setup
4. **Start with the basics** in our {ref}`user-guide/introduction`

## Next Steps

Ready to dive deeper? Check out the {ref}`user-guide/introduction` for a comprehensive overview.
```

#### Create user-guide/introduction.md
```markdown
---
title: "Introduction to User Guide"
authors:
  - name: "Your Name"
    email: "your.email@example.com"
date: "2024-01-15"
description: "Introduction to the comprehensive user guide"
keywords: ["user guide", "introduction", "overview"]
status: "published"
---

# Introduction to User Guide

This section provides a comprehensive overview of all features and capabilities.

## Overview

Our platform offers a wide range of features designed to help you be more productive.

## Key Concepts

### Core Features

- **Feature 1**: Description of the first key feature
- **Feature 2**: Description of the second key feature
- **Feature 3**: Description of the third key feature

### Advanced Features

- **Advanced Feature 1**: Description
- **Advanced Feature 2**: Description

## Getting Help

If you need help, check out:

- The {ref}`getting-started` guide for basics
- The {ref}`api-reference` for technical details
```

#### Create api-reference.md
```markdown
---
title: "API Reference"
authors:
  - name: "Your Name"
    email: "your.email@example.com"
date: "2024-01-15"
description: "Complete API reference documentation"
keywords: ["API", "reference", "technical"]
status: "published"
---

# API Reference

Complete technical documentation for our API.

## Authentication

All API requests require authentication.

## Endpoints

### GET /api/users

Retrieve a list of users.

**Parameters:**
- `limit` (optional): Number of users to return
- `offset` (optional): Number of users to skip

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |
```

## Step 3: Configure SharePoint Connection

### Set Up Doctor Configuration

**Option A: Using command line**
```bash
# Configure your SharePoint site
doctor4mystmd config --site-url "https://yourtenant.sharepoint.com/sites/your-site"

# Optional: Set list ID and folder path
doctor4mystmd config --list-id "your-list-id" --folder-path "Documents/MyST"
```

**Option B: Using configuration file**
Create a `doctor.config.json` file in your project root:
```json
{
  "siteUrl": "https://yourtenant.sharepoint.com/sites/your-site",
  "listId": "your-list-id",
  "folderPath": "Documents/MyST",
  "authentication": {
    "type": "spfx"
  }
}
```

The CLI will automatically read from this file when `--site-url` is not provided.

### Verify Configuration
```bash
# Check your configuration
doctor4mystmd config --show
```

## Step 4: Test Your Setup

### Dry Run
Before publishing, test your setup with a dry run:

```bash
# Test with dry run
doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/your-site" --dry-run
```

This will show you what would be published without actually creating SharePoint pages.

### Expected Output
```
📖 Building page structure from ./myst.yml...
📝 Found 5 pages to process

🔄 Processing: Welcome to My Documentation (index)

📄 Would publish content from ./index.md
   Title: Welcome to My Documentation
   Level: 0
   Order: 1
   Metadata: Title: Welcome to My Documentation
Authors: Your Name
Date: 2024-01-15
Description: Welcome page for my documentation site
Keywords: documentation, getting started

🔄 Processing: Getting Started (getting-started)

📄 Would publish content from ./getting-started.md
   Title: Getting Started
   Level: 0
   Order: 2
   Metadata: Title: Getting Started
Authors: Your Name
Date: 2024-01-15
Description: A quick start guide for new users
Keywords: getting started, tutorial, basics

🔍 Dry run completed. Use --dry-run=false to actually publish.
```

## Step 5: Publish to SharePoint

### Publish Your Content
Once you're satisfied with the dry run, publish your content:

```bash
# Publish with navigation and metadata
doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/your-site" --add-navigation --add-site-navigation

# Publish with static resources (images, CSS, JS, etc.)
doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/your-site" --upload-resources --assets-dir "assets"
```

### Expected Output
```
📖 Building page structure from ./myst.yml...
📝 Found 5 pages to process

🔄 Processing: Welcome to My Documentation (index)

✅ Published: Welcome to My Documentation
   Metadata: Title: Welcome to My Documentation
Authors: Your Name
Date: 2024-01-15
Description: Welcome page for my documentation site
Keywords: documentation, getting started

🔄 Processing: Getting Started (getting-started)

✅ Published: Getting Started
   Metadata: Title: Getting Started
Authors: Your Name
Date: 2024-01-15
Description: A quick start guide for new users
Keywords: getting started, tutorial, basics

📦 Found 3 static resources
📤 Uploading: images/logo.png
✅ Uploaded: images/logo.png -> https://yourtenant.sharepoint.com/sites/your-site/assets/images/logo.png
📤 Uploading: styles/main.css
✅ Uploaded: styles/main.css -> https://yourtenant.sharepoint.com/sites/your-site/assets/styles/main.css

📊 Resource Upload Report
========================
Total resources: 3
Successfully uploaded: 3
Failed: 0
Total size: 1.2 MB
Uploaded size: 1.2 MB

🎉 Successfully published 5 pages to SharePoint
```

## Step 6: Verify Your Published Content

### Check SharePoint
1. Navigate to your SharePoint site
2. Go to the specified list or folder
3. Verify that your pages have been created
4. Check that metadata has been applied correctly
5. Test cross-references and navigation

### List Published Pages
```bash
# List all pages in your SharePoint site
doctor4mystmd list --site-url "https://yourtenant.sharepoint.com/sites/your-site"
```

## Step 7: Update and Maintain Content

### Update Content
When you need to update your content:

1. **Edit your Markdown files**
2. **Update frontmatter if needed**
3. **Test with dry run**:
   ```bash
   doctor4mystmd publish-toc ./myst.yml --dry-run
   ```
4. **Publish updates**:
   ```bash
   doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/your-site"
   ```

### Add New Pages
To add new pages:

1. **Create new Markdown files**
2. **Add them to myst.yml**:
   ```yaml
   toc:
     - file: index.md
       title: "Home"
     - file: new-page.md          # Add new page
       title: "New Page"
   ```
3. **Publish updates**

## Advanced Features

### Static Resource Handling

Doctor4MySTMD automatically handles static resources like images, CSS, JavaScript, and documents:

#### Supported Resource Types

- **Images**: PNG, JPG, JPEG, GIF, SVG, WebP, ICO
- **Stylesheets**: CSS files
- **Scripts**: JavaScript files
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Archives**: ZIP, TAR, GZ
- **Fonts**: WOFF, WOFF2, TTF, EOT

#### Using Static Resources

```markdown
# Images
![Alt text](images/screenshot.png)
![Logo](assets/logo.svg)

# Links to documents
[Download PDF](docs/manual.pdf)
[Excel Template](templates/data.xlsx)

# CSS and JavaScript
<link rel="stylesheet" href="styles/main.css">
<script src="scripts/app.js"></script>
```

#### Resource Upload Options

```bash
# Basic resource upload
doctor4mystmd publish-toc ./myst.yml --upload-resources

# Advanced options
doctor4mystmd publish-toc ./myst.yml \
  --upload-resources \
  --assets-dir "assets" \
  --preserve-structure \
  --max-file-size 50 \
  --allowed-extensions "png,jpg,pdf,css,js" \
  --excluded-patterns "temp,backup"
```

#### Resource Configuration

- `--assets-dir`: Directory name for assets in SharePoint
- `--preserve-structure`: Maintain folder structure when uploading
- `--max-file-size`: Maximum file size in MB (default: 10)
- `--allowed-extensions`: Comma-separated list of allowed extensions
- `--excluded-patterns`: Patterns to exclude from uploads

### Custom Metadata
Add custom fields to your frontmatter:

```yaml
---
title: "My Document"
authors:
  - name: "John Doe"
custom_field: "Custom Value"
department: "Engineering"
priority: "High"
---
```

### Cross-References
Use cross-references between pages:

```markdown
# In one page
See the {ref}`getting-started` guide for more information.

# In another page
Check out the {ref}`api-reference` for technical details.
```

### Navigation
The tool automatically generates:

- **Breadcrumbs**: Show current page location
- **Page Navigation**: Previous/Next page links
- **Site Navigation**: Hierarchical menu structure
- **Table of Contents**: For each section

## Troubleshooting

### Common Issues

#### 1. Doctor Not Found
```bash
# Error: Doctor is not installed
# Solution: Install Doctor
npm install -g @estruyf/doctor
```

#### 2. MyST CLI Not Found
```bash
# Error: mystmd command not found
# Solution: Install MyST CLI
npm install -g mystmd
```

#### 3. SharePoint Authentication Issues
```bash
# Error: Authentication failed
# Solution: Check your SharePoint permissions and configuration
doctor4mystmd config --show
```

#### 4. File Not Found
```bash
# Error: File not found
# Solution: Check file paths in myst.yml
# Make sure all referenced files exist
```

### Debug Mode
Enable debug logging:

```bash
DEBUG=doctor4mystmd:* doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/your-site"
```

## Next Steps

Now that you have a working setup, you can:

1. **Explore advanced features** like custom roles and directives
2. **Set up automated publishing** with CI/CD pipelines
3. **Customize the navigation** and styling
4. **Add more complex content** with math, tables, and code blocks
5. **Integrate with other tools** in your documentation workflow

## Getting Help

- **Documentation**: Check the main README.md for detailed information
- **Examples**: Look at the examples/ directory for sample projects
- **Issues**: Report problems on the GitHub repository
- **Community**: Join discussions and ask questions

## Summary

You've successfully:

✅ Set up Doctor4MySTMD  
✅ Created a MyST project with TOC structure  
✅ Added content with frontmatter metadata  
✅ Configured SharePoint connection  
✅ Published content to SharePoint  
✅ Verified the published content  

Your MyST documentation is now live on SharePoint with proper navigation, cross-references, and metadata! 🎉
