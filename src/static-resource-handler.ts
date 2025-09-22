/**
 * Static Resource Handler - Handles uploading and managing static resources in SharePoint
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DoctorConfig } from './types';

const execAsync = promisify(exec);

export interface StaticResource {
  originalPath: string;
  relativePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sharePointUrl?: string;
  uploaded: boolean;
  error?: string;
}

export interface ResourceUploadOptions {
  baseDir: string;
  assetsDir?: string;
  uploadToSharePoint: boolean;
  preserveStructure: boolean;
  maxFileSize?: number; // in bytes
  allowedExtensions?: string[];
  excludedPatterns?: string[];
}

export class StaticResourceHandler {
  private config: DoctorConfig;
  private doctorPath: string;
  private resources: Map<string, StaticResource> = new Map();

  constructor(config: DoctorConfig, doctorPath: string = 'npx doctor') {
    this.config = config;
    this.doctorPath = doctorPath;
  }

  /**
   * Extract static resources from content
   */
  async extractResources(
    content: string,
    contentPath: string,
    options: ResourceUploadOptions
  ): Promise<StaticResource[]> {
    const resources: StaticResource[] = [];
    const baseDir = path.resolve(options.baseDir);
    const contentDir = path.dirname(contentPath);

    // Patterns to match static resources
    const patterns = [
      // Images
      /!\[([^\]]*)\]\(([^)]+)\)/g,                    // Markdown images: ![alt](url)
      /<img[^>]+src=["']([^"']+)["'][^>]*>/g,        // HTML images: <img src="url">
      /background-image:\s*url\(["']?([^"']+)["']?\)/g, // CSS background images
      
      // Links to files
      /\[([^\]]*)\]\(([^)]+\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx|zip|tar|gz))\)/g, // Document links
      
      // CSS and JS files
      /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/g,  // CSS links
      /<script[^>]+src=["']([^"']+\.js)["'][^>]*>/g,  // JS scripts
      
      // Other assets
      /url\(["']?([^"']+)["']?\)/g,                   // CSS url() references
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const resourcePath = match[2] || match[1]; // Different patterns have different capture groups
        
        if (this.isValidResource(resourcePath, options)) {
          const fullPath = this.resolveResourcePath(resourcePath, contentDir, baseDir);
          
          if (fullPath && await fs.pathExists(fullPath)) {
            const resource = await this.createResourceInfo(fullPath, baseDir, options);
            if (resource) {
              resources.push(resource);
            }
          }
        }
      }
    }

    return resources;
  }

  /**
   * Check if a resource path is valid
   */
  private isValidResource(resourcePath: string, options: ResourceUploadOptions): boolean {
    // Skip external URLs
    if (resourcePath.startsWith('http://') || resourcePath.startsWith('https://') || resourcePath.startsWith('//')) {
      return false;
    }

    // Skip data URLs
    if (resourcePath.startsWith('data:')) {
      return false;
    }

    // Check file extension
    const ext = path.extname(resourcePath).toLowerCase();
    if (options.allowedExtensions && !options.allowedExtensions.includes(ext)) {
      return false;
    }

    // Check excluded patterns
    if (options.excludedPatterns) {
      for (const pattern of options.excludedPatterns) {
        if (resourcePath.includes(pattern)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Resolve resource path to absolute path
   */
  private resolveResourcePath(resourcePath: string, contentDir: string, baseDir: string): string | null {
    try {
      // Handle different path formats
      let resolvedPath: string;
      
      if (resourcePath.startsWith('/')) {
        // Absolute path from base directory
        resolvedPath = path.join(baseDir, resourcePath.substring(1));
      } else if (resourcePath.startsWith('./') || resourcePath.startsWith('../')) {
        // Relative path from content file
        resolvedPath = path.resolve(contentDir, resourcePath);
      } else {
        // Relative path from content file (no prefix)
        resolvedPath = path.resolve(contentDir, resourcePath);
      }

      return resolvedPath;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create resource information
   */
  private async createResourceInfo(
    fullPath: string,
    baseDir: string,
    options: ResourceUploadOptions
  ): Promise<StaticResource | null> {
    try {
      const stats = await fs.stat(fullPath);
      
      // Check file size
      if (options.maxFileSize && stats.size > options.maxFileSize) {
        console.warn(`⚠️  File too large: ${fullPath} (${stats.size} bytes)`);
        return null;
      }

      const relativePath = path.relative(baseDir, fullPath);
      const fileName = path.basename(fullPath);
      const mimeType = this.getMimeType(fullPath);

      return {
        originalPath: fullPath,
        relativePath,
        fileName,
        fileSize: stats.size,
        mimeType,
        uploaded: false
      };
    } catch (error) {
      console.warn(`⚠️  Error reading file ${fullPath}: ${error}`);
      return null;
    }
  }

  /**
   * Get MIME type for file
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Upload resources to SharePoint
   */
  async uploadResources(resources: StaticResource[], options: ResourceUploadOptions): Promise<Map<string, StaticResource>> {
    const results = new Map<string, StaticResource>();

    for (const resource of resources) {
      try {
        console.log(`📤 Uploading: ${resource.relativePath}`);
        
        if (!options.uploadToSharePoint) {
          // Just mark as processed without uploading
          resource.uploaded = true;
          results.set(resource.relativePath, resource);
          continue;
        }

        // Upload to SharePoint using Doctor
        const sharePointUrl = await this.uploadToSharePoint(resource, options);
        
        if (sharePointUrl) {
          resource.sharePointUrl = sharePointUrl;
          resource.uploaded = true;
          console.log(`✅ Uploaded: ${resource.relativePath} -> ${sharePointUrl}`);
        } else {
          resource.error = 'Upload failed';
          console.error(`❌ Failed to upload: ${resource.relativePath}`);
        }

        results.set(resource.relativePath, resource);
      } catch (error) {
        resource.error = String(error);
        resource.uploaded = false;
        console.error(`❌ Error uploading ${resource.relativePath}: ${error}`);
        results.set(resource.relativePath, resource);
      }
    }

    return results;
  }

  /**
   * Upload single resource to SharePoint
   */
  private async uploadToSharePoint(resource: StaticResource, options: ResourceUploadOptions): Promise<string | null> {
    try {
      // Create SharePoint folder path
      const folderPath = this.getSharePointFolderPath(resource, options);
      
      // Use Doctor to upload file
      const args = [
        'upload',
        `"${resource.originalPath}"`,
        '--site-url', this.config.siteUrl,
        '--folder-path', folderPath
      ];

      if (this.config.listId) {
        args.push('--list-id', this.config.listId);
      }

      const command = `${this.doctorPath} ${args.join(' ')}`;
      const { stdout } = await execAsync(command);
      
      // Parse the output to get the SharePoint URL
      // This is a simplified implementation - you might need to adjust based on Doctor's actual output
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('http') && line.includes('sharepoint')) {
          return line.trim();
        }
      }

      // Fallback: construct URL based on site URL and file path
      const fileName = path.basename(resource.originalPath);
      return `${this.config.siteUrl}/_layouts/15/download.aspx?SourceUrl=${encodeURIComponent(folderPath + '/' + fileName)}`;
    } catch (error) {
      throw new Error(`Failed to upload ${resource.relativePath}: ${error}`);
    }
  }

  /**
   * Get SharePoint folder path for resource
   */
  private getSharePointFolderPath(resource: StaticResource, options: ResourceUploadOptions): string {
    let folderPath = this.config.folderPath || 'Documents';
    
    if (options.preserveStructure) {
      const dirPath = path.dirname(resource.relativePath);
      if (dirPath && dirPath !== '.') {
        folderPath = path.join(folderPath, dirPath);
      }
    }

    // Add assets subfolder if specified
    if (options.assetsDir) {
      folderPath = path.join(folderPath, options.assetsDir);
    }

    return folderPath.replace(/\\/g, '/'); // Use forward slashes for SharePoint
  }

  /**
   * Update content with SharePoint URLs
   */
  updateContentWithSharePointUrls(
    content: string,
    resources: Map<string, StaticResource>
  ): string {
    let updatedContent = content;

    for (const [relativePath, resource] of resources) {
      if (resource.uploaded && resource.sharePointUrl) {
        // Replace relative paths with SharePoint URLs
        const patterns = [
          new RegExp(`!\\[([^\\]]*)\\]\\(${this.escapeRegex(relativePath)}\\)`, 'g'),
          new RegExp(`<img[^>]+src=["']${this.escapeRegex(relativePath)}["'][^>]*>`, 'g'),
          new RegExp(`\\[([^\\]]*)\\]\\(${this.escapeRegex(relativePath)}\\)`, 'g'),
          new RegExp(`href=["']${this.escapeRegex(relativePath)}["']`, 'g'),
          new RegExp(`url\\(["']?${this.escapeRegex(relativePath)}["']?\\)`, 'g')
        ];

        for (const pattern of patterns) {
          updatedContent = updatedContent.replace(pattern, (match, ...groups) => {
            return match.replace(relativePath, resource.sharePointUrl!);
          });
        }
      }
    }

    return updatedContent;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get resource statistics
   */
  getResourceStats(): {
    total: number;
    uploaded: number;
    failed: number;
    totalSize: number;
    uploadedSize: number;
  } {
    let total = 0;
    let uploaded = 0;
    let failed = 0;
    let totalSize = 0;
    let uploadedSize = 0;

    for (const resource of this.resources.values()) {
      total++;
      totalSize += resource.fileSize;
      
      if (resource.uploaded) {
        uploaded++;
        uploadedSize += resource.fileSize;
      } else {
        failed++;
      }
    }

    return {
      total,
      uploaded,
      failed,
      totalSize,
      uploadedSize
    };
  }

  /**
   * Generate resource report
   */
  generateResourceReport(): string {
    const stats = this.getResourceStats();
    let report = `\n📊 Resource Upload Report\n`;
    report += `========================\n`;
    report += `Total resources: ${stats.total}\n`;
    report += `Successfully uploaded: ${stats.uploaded}\n`;
    report += `Failed: ${stats.failed}\n`;
    report += `Total size: ${this.formatBytes(stats.totalSize)}\n`;
    report += `Uploaded size: ${this.formatBytes(stats.uploadedSize)}\n\n`;

    if (stats.failed > 0) {
      report += `❌ Failed uploads:\n`;
      for (const [path, resource] of this.resources) {
        if (!resource.uploaded && resource.error) {
          report += `  - ${path}: ${resource.error}\n`;
        }
      }
    }

    return report;
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
