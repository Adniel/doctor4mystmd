---
title: "Getting Started with Sample Project"
authors:
  - name: "Jane Smith"
    affiliation: "Technical Writing Team"
    email: "jane@example.com"
  - name: "John Doe"
    affiliation: "Developer Relations"
    email: "john@example.com"
date: "2024-01-16"
modified: "2024-01-20"
description: "A comprehensive guide to getting started with the sample MyST project"
keywords: ["MyST", "Getting Started", "Tutorial", "Sample"]
tags: ["tutorial", "beginner", "guide", "sample"]
status: "published"
version: "1.2.0"
---

# Getting Started with Sample Project

Welcome to our sample MyST project! This guide will help you understand how to use Doctor4MySTMD to publish structured documentation to SharePoint.

## What You'll Learn

In this guide, you'll learn:

1. How to set up a MyST project structure
2. How to create content with frontmatter metadata
3. How to use cross-references between pages
4. How to configure and publish to SharePoint
5. How to maintain and update your content

## Prerequisites

Before you begin, make sure you have:

- **Node.js** (v16 or higher) installed
- **MyST CLI** (`mystmd`) installed globally
- **Doctor** (@estruyf/doctor) installed globally
- **Doctor4MySTMD** installed and configured
- **Access to a SharePoint site** with appropriate permissions

## Project Setup

### 1. Create Project Structure

Start by creating a directory for your project:

```bash
mkdir my-documentation
cd my-documentation
```

### 2. Create myst.yml Configuration

Create a `myst.yml` file to define your project structure:

```yaml
version: 1

project:
  title: "My Documentation"
  description: "My awesome documentation"
  authors:
    - "Your Name"
  
  toc:
    - file: index.md
      title: "Home"
    - file: getting-started.md
      title: "Getting Started"
    - title: "User Guide"
      children:
        - file: user-guide/introduction.md
          title: "Introduction"
        - file: user-guide/usage.md
          title: "Usage"
```

### 3. Create Content Files

Create your Markdown files with frontmatter metadata:

```markdown
---
title: "My Document"
authors:
  - name: "Your Name"
    email: "your.email@example.com"
date: "2024-01-15"
description: "Document description"
keywords: ["tag1", "tag2"]
status: "published"
---

# My Document

Your content here...
```

## Content Creation

### Frontmatter Metadata

Each document should start with frontmatter metadata:

```yaml
---
title: "Document Title"                    # Required: Page title
authors:                                  # Optional: Author information
  - name: "John Doe"
    affiliation: "University"
    email: "john@example.com"
date: "2024-01-15"                       # Optional: Publication date
modified: "2024-01-20"                   # Optional: Last modified date
description: "Document description"       # Optional: Page description
keywords: ["tag1", "tag2"]               # Optional: Keywords for search
tags: ["category1", "category2"]         # Optional: Content tags
status: "published"                      # Optional: Publication status
version: "1.0.0"                         # Optional: Document version
---
```

### Cross-References

Use MyST roles to create cross-references:

```markdown
# Link to another page
See the {ref}`user-guide/introduction` for more details.

# Link to a section
Check out the {ref}`api-reference#authentication` section.

# Link to external content
Visit our [website](https://example.com) for more information.
```

### Math Expressions

Include mathematical content:

```markdown
# Inline math
The equation $E = mc^2$ is famous.

# Block math
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### Code Blocks

Add syntax-highlighted code:

```python
def hello_world():
    print("Hello, World!")
    return "success"

# Call the function
result = hello_world()
```

## Publishing to SharePoint

### 1. Configure Doctor

Set up your SharePoint connection:

```bash
# Configure SharePoint site
doctor4mystmd config --site-url "https://yourtenant.sharepoint.com/sites/your-site"

# Optional: Set additional options
doctor4mystmd config --list-id "your-list-id" --folder-path "Documents/MyST"
```

### 2. Test with Dry Run

Before publishing, test your setup:

```bash
# Test with dry run
doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/your-site" --dry-run
```

### 3. Publish Content

Publish your content to SharePoint:

```bash
# Publish with navigation and metadata
doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/your-site" --add-navigation --add-site-navigation
```

## Content Maintenance

### Updating Content

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

### Adding New Pages

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

### Managing Metadata

Update frontmatter to change SharePoint metadata:

```yaml
---
title: "Updated Title"
modified: "2024-01-25"           # Update modification date
status: "updated"                # Change status
version: "1.1.0"                 # Increment version
---
```

## Best Practices

### Content Organization

- **Use clear, descriptive titles** for your pages
- **Organize content hierarchically** in your TOC
- **Keep related content together** in sections
- **Use consistent naming conventions** for files

### Metadata Management

- **Always include a title** in your frontmatter
- **Use descriptive descriptions** for better search
- **Tag content appropriately** with keywords and tags
- **Track versions** and modification dates
- **Set appropriate status** (draft, review, published)

### Cross-References

- **Use meaningful reference names** that describe the content
- **Test all cross-references** before publishing
- **Keep references up-to-date** when restructuring content
- **Use relative references** when possible

## Troubleshooting

### Common Issues

#### 1. File Not Found
```bash
# Error: File not found
# Solution: Check file paths in myst.yml
# Make sure all referenced files exist
```

#### 2. Cross-Reference Errors
```bash
# Error: Reference not found
# Solution: Check reference names and file structure
# Ensure referenced pages exist in your TOC
```

#### 3. Metadata Issues
```bash
# Error: Invalid metadata
# Solution: Check frontmatter YAML syntax
# Validate required fields are present
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
DEBUG=doctor4mystmd:* doctor4mystmd publish-toc ./myst.yml --site-url "https://yourtenant.sharepoint.com/sites/your-site"
```

## Next Steps

Now that you understand the basics:

1. **Explore the {ref}`user-guide/introduction`** for detailed information
2. **Check out the {ref}`api-reference`** for technical details
3. **Learn about {ref}`advanced/customization`** for advanced features
4. **Review the {ref}`changelog`** for version history

## Getting Help

If you need help:

- **Check the {ref}`advanced/troubleshooting`** guide
- **Review the main README.md** for detailed documentation
- **Look at the examples/** directory for sample projects
- **Report issues** on the GitHub repository

Ready to dive deeper? Check out the {ref}`user-guide/introduction` for a comprehensive overview of all features!
