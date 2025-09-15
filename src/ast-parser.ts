/**
 * MyST AST Parser - Handles parsing MyST Markdown to AST
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MySTDocument, MySTNode } from './types';

const execAsync = promisify(exec);

export class MySTASTParser {
  private mystmdPath: string;

  constructor(mystmdPath: string = 'mystmd') {
    this.mystmdPath = mystmdPath;
  }

  /**
   * Parse a MyST Markdown file to AST
   */
  async parseFile(filePath: string): Promise<MySTDocument> {
    try {
      // Use mystmd to parse the file to AST
      const { stdout } = await execAsync(`${this.mystmdPath} parse "${filePath}" --format json`);
      const ast = JSON.parse(stdout);
      return ast as MySTDocument;
    } catch (error) {
      throw new Error(`Failed to parse MyST file ${filePath}: ${error}`);
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
