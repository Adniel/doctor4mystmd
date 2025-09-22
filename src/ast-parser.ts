/**
 * MyST AST Parser - Handles parsing MyST Markdown to AST
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MySTDocument, MySTNode } from './types';
import { FrontmatterParser, MySTFrontmatter } from './frontmatter-parser';

const execAsync = promisify(exec);

export class MySTASTParser {
  private mystmdPath: string;
  private frontmatterParser: FrontmatterParser;

  constructor(mystmdPath: string = 'npx mystmd') {
    this.mystmdPath = mystmdPath;
    this.frontmatterParser = new FrontmatterParser();
  }

  /**
   * Parse a MyST Markdown file to AST
   */
  async parseFile(filePath: string): Promise<MySTDocument> {
    try {
      // Use mystmd build --md to convert to markdown first
      // Note: mystmd creates the file in _build/exports/ directory
      const { stdout } = await execAsync(`${this.mystmdPath} build --md "${filePath}"`);
      
      // The output file is created in _build/exports/ directory
      const inputDir = path.dirname(filePath);
      const inputBase = path.basename(filePath, '.md');
      const outputFile = path.join(inputDir, '_build', 'exports', `${inputBase}.md`);
      const markdownContent = await fs.readFile(outputFile, 'utf8');
      
      // Clean up output file
      await fs.remove(outputFile);
      
      // For now, return a simple AST structure
      // In a real implementation, you might want to parse the markdown to AST
      return {
        type: 'root',
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            value: markdownContent
          }]
        }]
      } as MySTDocument;
    } catch (error) {
      throw new Error(`Failed to parse MyST file ${filePath}: ${error}`);
    }
  }

  /**
   * Parse a MyST Markdown file to AST with frontmatter
   */
  async parseFileWithFrontmatter(filePath: string): Promise<{ ast: MySTDocument; frontmatter: MySTFrontmatter }> {
    try {
      // Parse frontmatter first
      const { frontmatter, content } = await this.frontmatterParser.parseFrontmatterFromFile(filePath);
      
      // Create temporary file without frontmatter for mystmd parsing
      const tempFile = path.join(process.cwd(), `temp-${path.basename(filePath)}`);
      await fs.writeFile(tempFile, content, 'utf8');
      
      try {
        // Use mystmd to parse the file to AST
        // Use mystmd build --md to convert to markdown first
        // Note: mystmd creates the file in _build/exports/ directory
        const { stdout } = await execAsync(`${this.mystmdPath} build --md "${tempFile}"`);
        
        // The output file is created in _build/exports/ directory
        const tempDir = path.dirname(tempFile);
        const tempBase = path.basename(tempFile, '.md');
        const outputFile = path.join(tempDir, '_build', 'exports', `${tempBase}.md`);
        const markdownContent = await fs.readFile(outputFile, 'utf8');
        
        // Clean up output file
        await fs.remove(outputFile);
        
        // Return a simple AST structure
        const ast = {
          type: 'root',
          children: [{
            type: 'paragraph',
            children: [{
              type: 'text',
              value: markdownContent
            }]
          }]
        } as MySTDocument;
        
        return {
          ast,
          frontmatter
        };
      } finally {
        // Clean up temporary file
        await fs.remove(tempFile);
      }
    } catch (error) {
      throw new Error(`Failed to parse MyST file with frontmatter ${filePath}: ${error}`);
    }
  }

  /**
   * Parse multiple MyST Markdown files
   */
  async parseFiles(filePaths: string[]): Promise<Map<string, MySTDocument>> {
    const results = new Map<string, MySTDocument>();
    
    for (const filePath of filePaths) {
      try {
        const ast = await this.parseFile(filePath);
        results.set(filePath, ast);
      } catch (error) {
        console.warn(`Warning: Failed to parse ${filePath}: ${error}`);
      }
    }
    
    return results;
  }

  /**
   * Parse all MyST files in a directory
   */
  async parseDirectory(dirPath: string, pattern: string = '**/*.md'): Promise<Map<string, MySTDocument>> {
    const glob = require('glob');
    const files = glob.sync(pattern, { cwd: dirPath });
    const fullPaths = files.map((file: string) => path.join(dirPath, file));
    return this.parseFiles(fullPaths);
  }

  /**
   * Validate MyST AST structure
   */
  validateAST(ast: MySTDocument): boolean {
    if (!ast || ast.type !== 'root') {
      return false;
    }
    
    if (!Array.isArray(ast.children)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get all nodes of a specific type from AST
   */
  getNodesByType(ast: MySTDocument, nodeType: string): MySTNode[] {
    const nodes: MySTNode[] = [];
    
    const traverse = (node: MySTNode) => {
      if (node.type === nodeType) {
        nodes.push(node);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    ast.children.forEach(traverse);
    return nodes;
  }
}
