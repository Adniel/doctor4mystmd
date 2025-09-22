/**
 * Doctor Integration - Handles SharePoint publishing using Doctor
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DoctorConfig } from './types';
import { SharePointMetadata } from './frontmatter-parser';

const execAsync = promisify(exec);

export class DoctorIntegration {
  private config: DoctorConfig;
  private doctorPath: string;

  constructor(config: DoctorConfig, doctorPath: string = 'npx doctor') {
    this.config = config;
    this.doctorPath = doctorPath;
  }

  /**
   * Initialize Doctor configuration
   */
  async initialize(): Promise<void> {
    try {
      // Check if Doctor is installed
      await execAsync(`${this.doctorPath} --version`);
    } catch (error) {
      throw new Error(`Doctor is not installed or not accessible. Please install it with: npm install -g @estruyf/doctor`);
    }

    // Create Doctor configuration file
    await this.createDoctorConfig();
  }

  /**
   * Create Doctor configuration file
   */
  private async createDoctorConfig(): Promise<void> {
    const config = {
      siteUrl: this.config.siteUrl,
      listId: this.config.listId,
      folderPath: this.config.folderPath,
      authentication: this.config.authentication || {
        type: 'spfx'
      }
    };

    const configPath = path.join(process.cwd(), 'doctor.config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * Publish a single file to SharePoint
   */
  async publishFile(filePath: string, options: { title?: string; description?: string; metadata?: SharePointMetadata } = {}): Promise<void> {
    try {
      const args = [
        'publish',
        `"${filePath}"`,
        '--site-url', this.config.siteUrl
      ];

      if (this.config.listId) {
        args.push('--list-id', this.config.listId);
      }

      if (this.config.folderPath) {
        args.push('--folder-path', this.config.folderPath);
      }

      if (options.title) {
        args.push('--title', options.title);
      }

      if (options.description) {
        args.push('--description', options.description);
      }

      // Add metadata if provided
      if (options.metadata) {
        for (const [key, value] of Object.entries(options.metadata)) {
          if (value !== undefined && value !== null && value !== '') {
            args.push(`--${key.toLowerCase()}`, String(value));
          }
        }
      }

      const command = `${this.doctorPath} ${args.join(' ')}`;
      console.log(`Publishing file: ${filePath}`);
      console.log(`Command: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.warn(stderr);
      }
    } catch (error) {
      throw new Error(`Failed to publish file ${filePath}: ${error}`);
    }
  }

  /**
   * Publish multiple files to SharePoint
   */
  async publishFiles(
    filePaths: string[], 
    options: { title?: string; description?: string; metadata?: SharePointMetadata } = {}
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const filePath of filePaths) {
      try {
        await this.publishFile(filePath, options);
        results.set(filePath, true);
        console.log(`✅ Successfully published: ${filePath}`);
      } catch (error) {
        console.error(`❌ Failed to publish: ${filePath} - ${error}`);
        results.set(filePath, false);
      }
    }
    
    return results;
  }

  /**
   * Publish all files in a directory
   */
  async publishDirectory(
    dirPath: string, 
    pattern: string = '**/*.md',
    options: { title?: string; description?: string; metadata?: SharePointMetadata } = {}
  ): Promise<Map<string, boolean>> {
    const glob = require('glob');
    const files = glob.sync(pattern, { cwd: dirPath });
    const fullPaths = files.map((file: string) => path.join(dirPath, file));
    
    return this.publishFiles(fullPaths, options);
  }

  /**
   * Create a SharePoint page from content
   */
  async createPage(
    title: string,
    content: string,
    options: { description?: string; tags?: string[]; metadata?: SharePointMetadata } = {}
  ): Promise<void> {
    try {
      // Create temporary file
      const tempFile = path.join(process.cwd(), 'temp-page.md');
      await fs.writeFile(tempFile, content, 'utf8');
      
      // Publish the temporary file
      await this.publishFile(tempFile, {
        title,
        description: options.description,
        metadata: options.metadata
      });
      
      // Clean up temporary file
      await fs.remove(tempFile);
    } catch (error) {
      throw new Error(`Failed to create SharePoint page: ${error}`);
    }
  }

  /**
   * Update an existing SharePoint page
   */
  async updatePage(
    pageId: string,
    content: string,
    options: { title?: string; description?: string; metadata?: SharePointMetadata } = {}
  ): Promise<void> {
    try {
      const args = [
        'update',
        pageId,
        '--content', `"${content}"`
      ];

      if (options.title) {
        args.push('--title', options.title);
      }

      if (options.description) {
        args.push('--description', options.description);
      }

      // Add metadata if provided
      if (options.metadata) {
        for (const [key, value] of Object.entries(options.metadata)) {
          if (value !== undefined && value !== null && value !== '') {
            args.push(`--${key.toLowerCase()}`, String(value));
          }
        }
      }

      const command = `${this.doctorPath} ${args.join(' ')}`;
      console.log(`Updating page: ${pageId}`);
      console.log(`Command: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.warn(stderr);
      }
    } catch (error) {
      throw new Error(`Failed to update page ${pageId}: ${error}`);
    }
  }

  /**
   * Delete a SharePoint page
   */
  async deletePage(pageId: string): Promise<void> {
    try {
      const command = `${this.doctorPath} delete ${pageId}`;
      console.log(`Deleting page: ${pageId}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.warn(stderr);
      }
    } catch (error) {
      throw new Error(`Failed to delete page ${pageId}: ${error}`);
    }
  }

  /**
   * List all pages in the SharePoint site
   */
  async listPages(): Promise<any[]> {
    try {
      const command = `${this.doctorPath} list --site-url ${this.config.siteUrl}`;
      const { stdout } = await execAsync(command);
      
      // Parse the output to extract page information
      // This is a simplified implementation - you might need to adjust based on Doctor's actual output format
      const lines = stdout.split('\n').filter(line => line.trim());
      const pages = lines.map(line => {
        // Assuming Doctor outputs pages in a specific format
        // You'll need to adjust this based on the actual output
        const parts = line.split('\t');
        return {
          id: parts[0],
          title: parts[1],
          url: parts[2],
          modified: parts[3]
        };
      });
      
      return pages;
    } catch (error) {
      throw new Error(`Failed to list pages: ${error}`);
    }
  }

  /**
   * Validate Doctor configuration
   */
  async validateConfig(): Promise<boolean> {
    try {
      // Test connection to SharePoint
      await this.listPages();
      return true;
    } catch (error) {
      console.error(`Configuration validation failed: ${error}`);
      return false;
    }
  }
}
