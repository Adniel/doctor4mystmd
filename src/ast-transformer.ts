/**
 * AST Transformer - Converts MyST AST to Doctor-compatible format
 */

import { MySTDocument, MySTNode, TransformOptions } from './types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class MySTASTTransformer {
  private options: TransformOptions;

  constructor(options: TransformOptions) {
    this.options = options;
  }

  /**
   * Transform MyST AST to Doctor-compatible Markdown
   */
  async transformToMarkdown(ast: MySTDocument): Promise<string> {
    const markdown = this.astToMarkdown(ast);
    return markdown;
  }

  /**
   * Transform MyST AST to HTML
   */
  async transformToHTML(ast: MySTDocument): Promise<string> {
    const html = this.astToHTML(ast);
    return html;
  }

  /**
   * Transform multiple ASTs and save to files
   */
  async transformAndSave(
    asts: Map<string, MySTDocument>, 
    outputDir: string
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    for (const [filePath, ast] of asts) {
      try {
        const fileName = path.basename(filePath, '.md');
        const outputPath = path.join(outputDir, `${fileName}.${this.options.outputFormat}`);
        
        let content: string;
        if (this.options.outputFormat === 'html') {
          content = await this.transformToHTML(ast);
        } else {
          content = await this.transformToMarkdown(ast);
        }
        
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, content, 'utf8');
        results.set(filePath, outputPath);
      } catch (error) {
        console.warn(`Warning: Failed to transform ${filePath}: ${error}`);
      }
    }
    
    return results;
  }

  /**
   * Convert AST to Markdown string
   */
  private astToMarkdown(ast: MySTDocument): string {
    return ast.children.map(node => this.nodeToMarkdown(node)).join('\n\n');
  }

  /**
   * Convert AST to HTML string
   */
  private astToHTML(ast: MySTDocument): string {
    const html = ast.children.map(node => this.nodeToHTML(node)).join('\n');
    return `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }

  /**
   * Convert a single node to Markdown
   */
  private nodeToMarkdown(node: MySTNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.depth || 1;
        const headingText = this.getNodeText(node);
        return `${'#'.repeat(level)} ${headingText}`;
      
      case 'paragraph':
        return this.getNodeText(node);
      
      case 'block_quote':
        const quoteText = this.getNodeText(node);
        return quoteText.split('\n').map(line => `> ${line}`).join('\n');
      
      case 'code_block':
        const language = node.lang || '';
        const code = this.getNodeText(node);
        return `\`\`\`${language}\n${code}\n\`\`\``;
      
      case 'list':
        return this.listToMarkdown(node);
      
      case 'table':
        return this.tableToMarkdown(node);
      
      case 'myst_role':
        return this.mystRoleToMarkdown(node);
      
      case 'myst_directive':
        return this.mystDirectiveToMarkdown(node);
      
      case 'math_block':
        return `$$\n${this.getNodeText(node)}\n$$`;
      
      case 'math':
        return `$${this.getNodeText(node)}$`;
      
      default:
        // Handle unknown nodes by converting children
        if (node.children) {
          return node.children.map(child => this.nodeToMarkdown(child)).join('');
        }
        return this.getNodeText(node);
    }
  }

  /**
   * Convert a single node to HTML
   */
  private nodeToHTML(node: MySTNode): string {
    switch (node.type) {
      case 'heading':
        const level = node.depth || 1;
        const headingText = this.getNodeText(node);
        return `<h${level}>${headingText}</h${level}>`;
      
      case 'paragraph':
        return `<p>${this.getNodeText(node)}</p>`;
      
      case 'block_quote':
        const quoteText = this.getNodeText(node);
        return `<blockquote>${quoteText}</blockquote>`;
      
      case 'code_block':
        const language = node.lang || '';
        const code = this.getNodeText(node);
        return `<pre><code class="language-${language}">${code}</code></pre>`;
      
      case 'list':
        return this.listToHTML(node);
      
      case 'table':
        return this.tableToHTML(node);
      
      case 'myst_role':
        return this.mystRoleToHTML(node);
      
      case 'myst_directive':
        return this.mystDirectiveToHTML(node);
      
      case 'math_block':
        return `<div class="math">$${this.getNodeText(node)}$$</div>`;
      
      case 'math':
        return `<span class="math">$${this.getNodeText(node)}$</span>`;
      
      default:
        // Handle unknown nodes by converting children
        if (node.children) {
          return node.children.map(child => this.nodeToHTML(child)).join('');
        }
        return this.getNodeText(node);
    }
  }

  /**
   * Convert list node to Markdown
   */
  private listToMarkdown(node: MySTNode): string {
    const ordered = node.ordered || false;
    const items = node.children || [];
    
    return items.map((item, index) => {
      const marker = ordered ? `${index + 1}.` : '-';
      const text = this.getNodeText(item);
      return `${marker} ${text}`;
    }).join('\n');
  }

  /**
   * Convert list node to HTML
   */
  private listToHTML(node: MySTNode): string {
    const ordered = node.ordered || false;
    const tag = ordered ? 'ol' : 'ul';
    const items = node.children || [];
    
    const itemHTML = items.map(item => {
      const text = this.getNodeText(item);
      return `<li>${text}</li>`;
    }).join('');
    
    return `<${tag}>${itemHTML}</${tag}>`;
  }

  /**
   * Convert table node to Markdown
   */
  private tableToMarkdown(node: MySTNode): string {
    // This is a simplified table conversion
    // You might want to implement more sophisticated table handling
    const rows = node.children || [];
    if (rows.length === 0) return '';
    
    const firstRow = rows[0];
    const headers = firstRow.children || [];
    const headerRow = headers.map(cell => this.getNodeText(cell)).join(' | ');
    const separatorRow = headers.map(() => '---').join(' | ');
    
    const dataRows = rows.slice(1).map(row => {
      const cells = row.children || [];
      return cells.map(cell => this.getNodeText(cell)).join(' | ');
    });
    
    return [headerRow, separatorRow, ...dataRows].join('\n');
  }

  /**
   * Convert table node to HTML
   */
  private tableToHTML(node: MySTNode): string {
    const rows = node.children || [];
    if (rows.length === 0) return '';
    
    const firstRow = rows[0];
    const headers = firstRow.children || [];
    const headerRow = headers.map(cell => `<th>${this.getNodeText(cell)}</th>`).join('');
    
    const dataRows = rows.slice(1).map(row => {
      const cells = row.children || [];
      return `<tr>${cells.map(cell => `<td>${this.getNodeText(cell)}</td>`).join('')}</tr>`;
    });
    
    return `<table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows.join('')}</tbody></table>`;
  }

  /**
   * Convert MyST role to Markdown
   */
  private mystRoleToMarkdown(node: MySTNode): string {
    const name = node.name || '';
    const value = this.getNodeText(node);
    
    // Map common MyST roles to Markdown equivalents
    const roleMappings: Record<string, string> = {
      'ref': `[${value}]`,
      'cite': `[${value}]`,
      'eq': `$${value}$`,
      'math': `$${value}$`,
      ...this.options.customMappings
    };
    
    return roleMappings[name] || `{${name}}${value}{/${name}}`;
  }

  /**
   * Convert MyST role to HTML
   */
  private mystRoleToHTML(node: MySTNode): string {
    const name = node.name || '';
    const value = this.getNodeText(node);
    
    // Map common MyST roles to HTML
    const roleMappings: Record<string, string> = {
      'ref': `<a href="#${value}">${value}</a>`,
      'cite': `<cite>${value}</cite>`,
      'eq': `<span class="math">$${value}$</span>`,
      'math': `<span class="math">$${value}$</span>`,
      ...this.options.customMappings
    };
    
    return roleMappings[name] || `<span class="myst-role myst-role-${name}">${value}</span>`;
  }

  /**
   * Convert MyST directive to Markdown
   */
  private mystDirectiveToMarkdown(node: MySTNode): string {
    const name = node.name || '';
    const args = node.args || [];
    const options = node.options || {};
    const content = this.getNodeText(node);
    
    let result = `\`\`\`{${name}`;
    
    if (args.length > 0) {
      result += ` ${args.join(' ')}`;
    }
    
    if (Object.keys(options).length > 0) {
      const optionStr = Object.entries(options)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      result += ` ${optionStr}`;
    }
    
    result += `}\n${content}\n\`\`\``;
    
    return result;
  }

  /**
   * Convert MyST directive to HTML
   */
  private mystDirectiveToHTML(node: MySTNode): string {
    const name = node.name || '';
    const args = node.args || [];
    const options = node.options || {};
    const content = this.getNodeText(node);
    
    const classes = ['myst-directive', `myst-directive-${name}`];
    const attributes = Object.entries(options)
      .map(([key, value]) => `data-${key}="${value}"`)
      .join(' ');
    
    return `<div class="${classes.join(' ')}" ${attributes}>
      <div class="myst-directive-content">${content}</div>
    </div>`;
  }

  /**
   * Extract text content from a node
   */
  private getNodeText(node: MySTNode): string {
    if (node.value) {
      return node.value;
    }
    
    if (node.children) {
      return node.children.map(child => this.getNodeText(child)).join('');
    }
    
    return '';
  }
}
