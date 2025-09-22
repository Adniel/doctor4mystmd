# Doctor4MySTMD

Publish MyST Markdown content to SharePoint using Doctor. This tool bridges the gap between the MyST ecosystem and SharePoint publishing by converting MyST AST (Abstract Syntax Tree) output to Doctor-compatible format and publishing it to SharePoint.

## Features

- **MyST AST Parsing**: Parse MyST Markdown files to Abstract Syntax Tree using `mystmd`
- **AST Transformation**: Convert MyST AST to Doctor-compatible Markdown or HTML
- **SharePoint Publishing**: Publish content to SharePoint using Doctor CLI
- **TOC Structure**: Use `myst.yml` configuration for hierarchical page organization
- **Cross-References**: Automatic cross-page reference resolution and linking
- **Frontmatter Support**: Map MyST frontmatter metadata to SharePoint page properties
- **Navigation Generation**: Automatic breadcrumbs, page navigation, and site navigation
- **Static Resource Handling**: Upload images, CSS, JS, documents, and other assets to SharePoint
- **Batch Processing**: Process multiple files or entire directories
- **Flexible Configuration**: Support for various SharePoint configurations
- **Command Line Interface**: Easy-to-use CLI for all operations

## Installation

### Prerequisites

1. **Node.js** (v16 or higher)
2. **MyST CLI** (`mystmd`): Install with `npm install -g @mystmd/cli`
3. **Doctor**: Install with `npm install -g @estruyf/doctor`

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

## Quick Start

### Option 1: Automated Setup

Run the quick start script to set up everything automatically:

```bash
# Make the script executable and run it
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

### Option 2: Manual Setup

#### 1. Install Prerequisites

```bash
# Install MyST CLI
npm install -g mystmd

# Install Doctor
npm install -g @estruyf/doctor

# Install Doctor4MySTMD
npm install -g .
```

#### 2. Configure Doctor

**Option A: Using command line parameters**
```bash
# Set SharePoint site URL
doctor4mystmd config --site-url "https://yourtenant.sharepoint.com/sites/yoursite"

# Optional: Set list ID and folder path
doctor4mystmd config --list-id "your-list-id" --folder-path "Documents/MyST"
```

**Option B: Using configuration file**
Create a `doctor.config.json` file in your project root:
```json
{
  "siteUrl": "https://yourtenant.sharepoint.com/sites/yoursite",
  "listId": "your-list-id",
  "folderPath": "Documents/MyST",
  "authentication": {
    "type": "spfx"
  }
}
```

The CLI will automatically read from this file when `--site-url` is not provided.

#### 3. Publish MyST Content

```bash
# Publish a single file
doctor4mystmd publish ./my-document.md --title "My Document"

# Publish all Markdown files in a directory
doctor4mystmd publish ./docs --pattern "**/*.md"

# Publish using TOC structure from myst.yml (with config file)
doctor4mystmd publish-toc ./myst.yml

# Publish using TOC structure from myst.yml (with command line)
doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/yoursite"

# Dry run to see what would be published
doctor4mystmd publish-toc ./myst.yml --dry-run
```

### 📖 Complete Getting Started Guide

For detailed step-by-step instructions, see **[GETTING_STARTED.md](GETTING_STARTED.md)** - a comprehensive guide that walks you through:

- Setting up your environment
- Creating a MyST project structure
- Adding content with frontmatter metadata
- Configuring SharePoint connection
- Publishing and maintaining content
- Troubleshooting common issues

## Usage

### Command Line Interface

#### Parse MyST Files

```bash
# Parse a single file
doctor4mystmd parse ./document.md

# Parse all files in a directory
doctor4mystmd parse ./docs --pattern "**/*.md"

# Save AST to specific output directory
doctor4mystmd parse ./docs -o ./ast-output
```

#### Transform AST

```bash
# Transform to Markdown (default)
doctor4mystmd transform ./document.md

# Transform to HTML
doctor4mystmd transform ./document.md --format html

# Transform with MyST features preserved
doctor4mystmd transform ./document.md --preserve-myst
```

#### Publish to SharePoint

```bash
# Basic publishing
doctor4mystmd publish ./document.md --site-url "https://yourtenant.sharepoint.com/sites/yoursite"

# With custom title and description
doctor4mystmd publish ./document.md --title "My Document" --description "A sample document"

# Publish entire directory
doctor4mystmd publish ./docs --pattern "**/*.md"

# Publish using TOC structure
doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/yoursite"

# With navigation and metadata
doctor4mystmd publish-toc ./myst.yml --add-navigation --add-site-navigation

# Dry run to preview
doctor4mystmd publish-toc ./myst.yml --dry-run
```

#### Manage Configuration

```bash
# Show current configuration
doctor4mystmd config --show

# Set configuration
doctor4mystmd config --site-url "https://yourtenant.sharepoint.com/sites/yoursite" --list-id "your-list-id"
```

#### List SharePoint Pages

```bash
# List all pages in the site
doctor4mystmd list

# List pages from specific site
doctor4mystmd list --site-url "https://yourtenant.sharepoint.com/sites/yoursite"
```

### Programmatic Usage

```typescript
import { Doctor4MySTMD, DoctorConfig, TransformOptions } from 'doctor4mystmd';

// Configuration
const doctorConfig: DoctorConfig = {
  siteUrl: 'https://yourtenant.sharepoint.com/sites/yoursite',
  listId: 'your-list-id',
  folderPath: 'Documents/MyST',
  authentication: {
    type: 'spfx'
  }
};

const transformOptions: TransformOptions = {
  outputFormat: 'markdown',
  preserveMySTFeatures: true,
  customMappings: {
    'ref': '[{value}]',
    'cite': '[{value}]'
  }
};

// Initialize application
const app = new Doctor4MySTMD(doctorConfig, transformOptions);
await app.initialize();

// Process and publish content
const results = await app.processAndPublish('./docs', {
  title: 'My Documentation',
  description: 'Generated from MyST Markdown'
});

// Check results
for (const [filePath, success] of results) {
  console.log(`${filePath}: ${success ? '✅' : '❌'}`);
}
```

## Configuration

### Doctor Configuration

The tool uses Doctor's configuration system. You can configure it via:

1. **Command line options** (recommended for one-time use)
2. **Configuration file** (`doctor.config.json`)
3. **Environment variables**

Example `doctor.config.json`:

```json
{
  "siteUrl": "https://yourtenant.sharepoint.com/sites/yoursite",
  "listId": "your-list-id",
  "folderPath": "Documents/MyST",
  "authentication": {
    "type": "spfx"
  }
}
```

### Transform Options

```typescript
interface TransformOptions {
  outputFormat: 'markdown' | 'html';
  preserveMySTFeatures: boolean;
  customMappings?: Record<string, string>;
}
```

## MyST Frontmatter Support

Doctor4MySTMD automatically extracts and maps MyST frontmatter metadata to SharePoint page properties:

### Supported Frontmatter Fields

```yaml
---
title: "Document Title"                    # → SharePoint Title
authors:                                  # → SharePoint Author
  - name: "John Doe"
    affiliation: "University"
    email: "john@example.com"
date: "2024-01-15"                       # → SharePoint Created
modified: "2024-01-20"                   # → SharePoint Modified
description: "Document description"       # → SharePoint Description
keywords: ["tag1", "tag2"]               # → SharePoint Keywords
tags: ["category1", "category2"]         # → SharePoint Tags
status: "published"                      # → SharePoint Status
version: "1.0.0"                         # → SharePoint Version
license: "MIT"                           # → Custom field
doi: "10.1000/example"                   # → Custom field
---
```

### Metadata Mapping

| MyST Frontmatter | SharePoint Field | Notes |
|------------------|------------------|-------|
| `title` | Title | Document title |
| `authors` | Author | Comma-separated author names |
| `date` | Created | Publication date |
| `modified` | Modified | Last modified date |
| `description` | Description | Document summary |
| `keywords` | Keywords | Semicolon-separated keywords |
| `tags` | Tags | Semicolon-separated tags |
| `status` | Status | Document status |
| `version` | Version | Document version |
| Custom fields | Custom fields | Any additional fields |

## Static Resource Handling

Doctor4MySTMD automatically handles static resources like images, CSS, JavaScript, and documents:

### Supported Resource Types

- **Images**: PNG, JPG, JPEG, GIF, SVG, WebP, ICO
- **Stylesheets**: CSS files
- **Scripts**: JavaScript files
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Archives**: ZIP, TAR, GZ
- **Fonts**: WOFF, WOFF2, TTF, EOT

### Resource Upload Options

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

### Resource Configuration

- `--upload-resources`: Enable static resource upload
- `--assets-dir`: Directory name for assets in SharePoint (default: "assets")
- `--preserve-structure`: Maintain folder structure when uploading (default: true)
- `--max-file-size`: Maximum file size in MB (default: 10)
- `--allowed-extensions`: Comma-separated list of allowed extensions
- `--excluded-patterns`: Patterns to exclude from uploads

## Supported MyST Features

The transformer supports most MyST Markdown features:

- **Headings**: All heading levels (H1-H6)
- **Paragraphs**: Standard paragraph text
- **Lists**: Ordered and unordered lists
- **Code blocks**: With syntax highlighting
- **Tables**: Basic table support
- **Math**: Inline and block math expressions
- **MyST Roles**: Custom role mappings with cross-reference support
- **MyST Directives**: Custom directive support
- **Block quotes**: Nested quote support
- **Cross-References**: Automatic linking between pages
- **Navigation**: Breadcrumbs and page navigation

## Custom Mappings

You can define custom mappings for MyST roles and directives:

```typescript
const customMappings = {
  'ref': '[{value}]',           // Reference role
  'cite': '[{value}]',          // Citation role
  'eq': '${value}$',            // Equation role
  'math': '${value}$'           // Math role
};
```

## Error Handling

The tool provides comprehensive error handling:

- **Parse errors**: Invalid MyST syntax
- **Transform errors**: AST transformation issues
- **Publish errors**: SharePoint connectivity or permission issues
- **Configuration errors**: Missing or invalid configuration

## Troubleshooting

### Common Issues

1. **Doctor not found**: Ensure Doctor is installed globally
   ```bash
   npm install -g @estruyf/doctor
   ```

2. **MyST CLI not found**: Ensure MyST CLI is installed
   ```bash
   npm install -g @mystmd/cli
   ```

3. **SharePoint authentication**: Check your authentication configuration
   ```bash
   doctor4mystmd config --show
   ```

4. **Permission errors**: Ensure you have write access to the SharePoint site

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=doctor4mystmd:* doctor4mystmd publish ./docs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [MyST Markdown](https://mystmd.org/) - The MyST ecosystem
- [Doctor](https://github.com/estruyf/doctor) - SharePoint publishing tool
- [CLI for Microsoft 365](https://pnp.github.io/cli-microsoft365/) - Underlying SharePoint integration
