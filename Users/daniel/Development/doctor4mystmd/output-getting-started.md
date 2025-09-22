---
title: Getting Started with MyST
content_includes_title: false
parts: {}
---
+++
Welcome to MyST! This guide will help you get up and running quickly.

## What is MyST?

MyST (Markdown Structured Text) is a powerful extension of Markdown designed for scientific and technical writing. It adds structured elements that make it perfect for documentation, books, and academic papers.

## Key Features

*   **Structured Markdown**: Enhanced markdown with semantic elements
*   **Cross-References**: Link between documents and sections
*   **Math Support**: LaTeX-style math expressions
*   **Custom Roles**: Define your own markup elements
*   **Directives**: Block-level custom elements

## Installation

To use MyST, you need to install the MyST CLI:

```bash
npm install -g mystmd
```

## Basic Usage

Create a simple MyST document:

```markdown
# My First MyST Document

This is a paragraph with **bold text** and *italic text*.

## Math Expressions

Inline math: $E = mc^2$

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Cross-References

Link to other sections: {ref}`installation`

## Next Steps

Now that you understand the basics, explore the {ref}`user-guide/introduction` for more detailed information.
```