/**
 * Frontmatter Parser - Handles MyST frontmatter metadata extraction and mapping
 */

import * as fs from 'fs-extra';
import * as yaml from 'yaml';

export interface MySTFrontmatter {
  title?: string;
  authors?: Array<{
    name: string;
    affiliation?: string;
    email?: string;
    orcid?: string;
  }> | string[];
  date?: string;
  created?: string;
  modified?: string;
  version?: string;
  description?: string;
  abstract?: string;
  keywords?: string[];
  tags?: string[];
  categories?: string[];
  status?: 'draft' | 'review' | 'published' | 'archived';
  license?: string;
  doi?: string;
  url?: string;
  github?: string;
  [key: string]: any; // Allow custom fields
}

export interface SharePointMetadata {
  Title: string;
  Author?: string;
  Created?: string;
  Modified?: string;
  Description?: string;
  Keywords?: string;
  Status?: string;
  Version?: string;
  Category?: string;
  Tags?: string;
  [key: string]: any; // Allow custom fields
}

export class FrontmatterParser {
  /**
   * Parse frontmatter from MyST document content
   */
  parseFrontmatter(content: string): { frontmatter: MySTFrontmatter; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return {
        frontmatter: {},
        content: content
      };
    }
    
    try {
      const frontmatterYaml = match[1];
      const documentContent = match[2];
      
      const frontmatter = yaml.parse(frontmatterYaml) as MySTFrontmatter;
      
      return {
        frontmatter: frontmatter || {},
        content: documentContent
      };
    } catch (error) {
      console.warn(`Warning: Failed to parse frontmatter: ${error}`);
      return {
        frontmatter: {},
        content: content
      };
    }
  }

  /**
   * Parse frontmatter from file
   */
  async parseFrontmatterFromFile(filePath: string): Promise<{ frontmatter: MySTFrontmatter; content: string }> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return this.parseFrontmatter(content);
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Map MyST frontmatter to SharePoint metadata
   */
  mapToSharePointMetadata(frontmatter: MySTFrontmatter): SharePointMetadata {
    const metadata: SharePointMetadata = {
      Title: frontmatter.title || 'Untitled Document'
    };

    // Map authors
    if (frontmatter.authors) {
      if (Array.isArray(frontmatter.authors)) {
        if (typeof frontmatter.authors[0] === 'string') {
          metadata.Author = frontmatter.authors.join('; ');
        } else {
          metadata.Author = frontmatter.authors
            .map(author => typeof author === 'string' ? author : author.name)
            .join('; ');
        }
      } else {
        metadata.Author = String(frontmatter.authors);
      }
    }

    // Map dates
    if (frontmatter.date) {
      metadata.Created = this.formatDate(frontmatter.date);
    } else if (frontmatter.created) {
      metadata.Created = this.formatDate(frontmatter.created);
    }

    if (frontmatter.modified) {
      metadata.Modified = this.formatDate(frontmatter.modified);
    }

    // Map description
    if (frontmatter.description) {
      metadata.Description = frontmatter.description;
    } else if (frontmatter.abstract) {
      metadata.Description = frontmatter.abstract;
    }

    // Map keywords
    if (frontmatter.keywords) {
      metadata.Keywords = Array.isArray(frontmatter.keywords) 
        ? frontmatter.keywords.join('; ') 
        : String(frontmatter.keywords);
    }

    // Map tags
    if (frontmatter.tags) {
      metadata.Tags = Array.isArray(frontmatter.tags) 
        ? frontmatter.tags.join('; ') 
        : String(frontmatter.tags);
    }

    // Map categories
    if (frontmatter.categories) {
      metadata.Category = Array.isArray(frontmatter.categories) 
        ? frontmatter.categories.join('; ') 
        : String(frontmatter.categories);
    }

    // Map status
    if (frontmatter.status) {
      metadata.Status = frontmatter.status;
    }

    // Map version
    if (frontmatter.version) {
      metadata.Version = String(frontmatter.version);
    }

    // Map custom fields
    for (const [key, value] of Object.entries(frontmatter)) {
      if (!this.isStandardField(key)) {
        metadata[key] = this.formatValue(value);
      }
    }

    return metadata;
  }

  /**
   * Check if a field is a standard MyST frontmatter field
   */
  private isStandardField(key: string): boolean {
    const standardFields = [
      'title', 'authors', 'date', 'created', 'modified', 'version',
      'description', 'abstract', 'keywords', 'tags', 'categories',
      'status', 'license', 'doi', 'url', 'github'
    ];
    return standardFields.includes(key);
  }

  /**
   * Format a value for SharePoint
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (Array.isArray(value)) {
      return value.join('; ');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Format date for SharePoint
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      
      // Format as ISO string for SharePoint
      return date.toISOString();
    } catch (error) {
      return dateString; // Return original if formatting fails
    }
  }

  /**
   * Extract title from content if not in frontmatter
   */
  extractTitleFromContent(content: string): string | null {
    const lines = content.split('\n');
    
    // Look for first H1 heading
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      }
    }
    
    return null;
  }

  /**
   * Generate metadata summary
   */
  generateMetadataSummary(frontmatter: MySTFrontmatter): string {
    const parts: string[] = [];
    
    if (frontmatter.title) {
      parts.push(`Title: ${frontmatter.title}`);
    }
    
    if (frontmatter.authors) {
      const authorNames = Array.isArray(frontmatter.authors)
        ? frontmatter.authors.map(author => 
            typeof author === 'string' ? author : author.name
          ).join(', ')
        : String(frontmatter.authors);
      parts.push(`Authors: ${authorNames}`);
    }
    
    if (frontmatter.date) {
      parts.push(`Date: ${frontmatter.date}`);
    }
    
    if (frontmatter.description) {
      parts.push(`Description: ${frontmatter.description}`);
    }
    
    if (frontmatter.keywords) {
      const keywords = Array.isArray(frontmatter.keywords) 
        ? frontmatter.keywords.join(', ')
        : String(frontmatter.keywords);
      parts.push(`Keywords: ${keywords}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Validate frontmatter
   */
  validateFrontmatter(frontmatter: MySTFrontmatter): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!frontmatter.title) {
      errors.push('Title is recommended');
    }
    
    // Validate date format
    if (frontmatter.date && isNaN(new Date(frontmatter.date).getTime())) {
      errors.push('Invalid date format');
    }
    
    if (frontmatter.created && isNaN(new Date(frontmatter.created).getTime())) {
      errors.push('Invalid created date format');
    }
    
    if (frontmatter.modified && isNaN(new Date(frontmatter.modified).getTime())) {
      errors.push('Invalid modified date format');
    }
    
    // Validate authors format
    if (frontmatter.authors && !Array.isArray(frontmatter.authors)) {
      errors.push('Authors should be an array');
    }
    
    // Validate keywords format
    if (frontmatter.keywords && !Array.isArray(frontmatter.keywords)) {
      errors.push('Keywords should be an array');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
