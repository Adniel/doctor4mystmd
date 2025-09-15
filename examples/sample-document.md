# Sample MyST Document

This is a sample MyST Markdown document that demonstrates various features supported by Doctor4MySTMD.

## Introduction

MyST (Markdown Structured Text) is a powerful extension of Markdown that adds structured elements for scientific and technical writing.

## Basic Elements

### Headings

This document uses various heading levels to demonstrate the structure.

### Paragraphs

This is a regular paragraph with some **bold text** and *italic text*. You can also use `inline code` within paragraphs.

### Lists

Here's an unordered list:

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

And here's an ordered list:

1. First step
2. Second step
3. Third step

### Code Blocks

Here's a code block with syntax highlighting:

```python
def hello_world():
    print("Hello, World!")
    return "success"

# Call the function
result = hello_world()
```

### Block Quotes

> This is a block quote. It can contain multiple lines
> and is useful for highlighting important information
> or quoting external sources.

## MyST-Specific Features

### Math Expressions

Inline math: $E = mc^2$

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### MyST Roles

Here are some MyST roles:

- Reference: {ref}`my-section`
- Citation: {cite}`smith2023`
- Equation: {eq}`my-equation`
- Math: {math}`x^2 + y^2 = z^2`

### MyST Directives

Here's a custom directive:

```{note}
This is a note directive that provides additional information
to the reader.
```

```{warning}
This is a warning directive that highlights important
information that the reader should be aware of.
```

### Tables

| Feature | Supported | Notes |
|---------|-----------|-------|
| Headings | ✅ | All levels |
| Lists | ✅ | Ordered and unordered |
| Code | ✅ | With syntax highlighting |
| Math | ✅ | Inline and block |
| Tables | ✅ | Basic support |
| MyST Roles | ✅ | With custom mappings |
| MyST Directives | ✅ | Custom directive support |

## Conclusion

This sample document demonstrates the key features supported by Doctor4MySTMD. The tool can parse this MyST Markdown content, transform it to a Doctor-compatible format, and publish it to SharePoint.

For more information, see the [README](../README.md) file.
