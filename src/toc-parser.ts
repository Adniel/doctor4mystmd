/**
 * TOC Parser - Handles MyST table of contents configuration from myst.yml
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { glob } from 'glob';

export interface TOCEntry {
  file?: string;
  title?: string;
  url?: string;
  children?: TOCEntry[];
  pattern?: string;
  slug?: string;
}

export interface MySTConfig {
  version?: number;
  project?: {
    title?: string;
    description?: string;
    authors?: string[];
    keywords?: string[];
    toc?: TOCEntry[];
  };
  site?: {
    title?: string;
    description?: string;
    url?: string;
    logo?: string;
    favicon?: string;
  };
}

export interface PageInfo {
  filePath: string;
  title: string;
  slug: string;
  level: number;
  parent?: string;
  children: string[];
  order: number;
}

export class TOCParser {
  private config: MySTConfig | null = null;
  private pages: Map<string, PageInfo> = new Map();
  private pageOrder: string[] = [];

  /**
   * Parse myst.yml configuration file
   */
  async parseConfig(configPath: string): Promise<MySTConfig> {
    try {
      if (!await fs.pathExists(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`);
      }

      const content = await fs.readFile(configPath, 'utf8');
      this.config = yaml.parse(content) as MySTConfig;
      
      if (!this.config.project?.toc) {
        throw new Error('No table of contents found in myst.yml');
      }

      return this.config;
    } catch (error) {
      throw new Error(`Failed to parse myst.yml: ${error}`);
    }
  }

  /**
   * Build page structure from TOC configuration
   */
  async buildPageStructure(configPath: string, baseDir: string = '.'): Promise<Map<string, PageInfo>> {
    await this.parseConfig(configPath);
    
    if (!this.config?.project?.toc) {
      throw new Error('No TOC configuration found');
    }

    this.pages.clear();
    this.pageOrder = [];
    
    let order = 0;
    await this.processTOCEntries(this.config.project.toc, baseDir, 0, undefined, order);
    
    return this.pages;
  }

  /**
   * Process TOC entries recursively
   */
  private async processTOCEntries(
    entries: TOCEntry[],
    baseDir: string,
    level: number,
    parentSlug: string | undefined,
    order: number
  ): Promise<number> {
    for (const entry of entries) {
      if (entry.file) {
        // Process file entry
        const filePath = path.resolve(baseDir, entry.file);
        const slug = this.generateSlug(entry.file, entry.slug);
        const title = entry.title || this.extractTitleFromFile(filePath) || path.basename(entry.file, '.md');
        
        const pageInfo: PageInfo = {
          filePath,
          title,
          slug,
          level,
          parent: parentSlug,
          children: [],
          order: order++
        };

        this.pages.set(slug, pageInfo);
        this.pageOrder.push(slug);

        // Add to parent's children
        if (parentSlug && this.pages.has(parentSlug)) {
          this.pages.get(parentSlug)!.children.push(slug);
        }
      } else if (entry.pattern) {
        // Process pattern entry
        const files = await glob(entry.pattern, { cwd: baseDir });
        for (const file of files) {
          const filePath = path.resolve(baseDir, file);
          const slug = this.generateSlug(file, entry.slug);
          const title = entry.title || this.extractTitleFromFile(filePath) || path.basename(file, '.md');
          
          const pageInfo: PageInfo = {
            filePath,
            title,
            slug,
            level,
            parent: parentSlug,
            children: [],
            order: order++
          };

          this.pages.set(slug, pageInfo);
          this.pageOrder.push(slug);

          // Add to parent's children
          if (parentSlug && this.pages.has(parentSlug)) {
            this.pages.get(parentSlug)!.children.push(slug);
          }
        }
      } else if (entry.children) {
        // Process section with children
        const sectionSlug = this.generateSlug(entry.title || 'section', entry.slug);
        const sectionTitle = entry.title || 'Section';
        
        const sectionInfo: PageInfo = {
          filePath: '', // No file for section headers
          title: sectionTitle,
          slug: sectionSlug,
          level,
          parent: parentSlug,
          children: [],
          order: order++
        };

        this.pages.set(sectionSlug, sectionInfo);
        this.pageOrder.push(sectionSlug);

        // Add to parent's children
        if (parentSlug && this.pages.has(parentSlug)) {
          this.pages.get(parentSlug)!.children.push(sectionSlug);
        }

        // Process children
        order = await this.processTOCEntries(entry.children, baseDir, level + 1, sectionSlug, order);
      }
    }

    return order;
  }

  /**
   * Generate slug from file path or title
   */
  private generateSlug(filePath: string, customSlug?: string): string {
    if (customSlug) {
      return customSlug;
    }

    const baseName = path.basename(filePath, '.md');
    return baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Extract title from markdown file
   */
  private extractTitleFromFile(filePath: string): string | null {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Look for first H1 heading
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          return trimmed.substring(2).trim();
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get page information by slug
   */
  getPage(slug: string): PageInfo | undefined {
    return this.pages.get(slug);
  }

  /**
   * Get all pages
   */
  getAllPages(): Map<string, PageInfo> {
    return this.pages;
  }

  /**
   * Get pages in order
   */
  getPagesInOrder(): PageInfo[] {
    return this.pageOrder.map(slug => this.pages.get(slug)!).filter(Boolean);
  }

  /**
   * Get root level pages
   */
  getRootPages(): PageInfo[] {
    return this.getPagesInOrder().filter(page => page.level === 0);
  }

  /**
   * Get children of a page
   */
  getChildren(slug: string): PageInfo[] {
    const page = this.pages.get(slug);
    if (!page) return [];

    return page.children
      .map(childSlug => this.pages.get(childSlug))
      .filter(Boolean) as PageInfo[];
  }

  /**
   * Get parent of a page
   */
  getParent(slug: string): PageInfo | undefined {
    const page = this.pages.get(slug);
    if (!page?.parent) return undefined;

    return this.pages.get(page.parent);
  }

  /**
   * Get breadcrumb trail for a page
   */
  getBreadcrumb(slug: string): PageInfo[] {
    const breadcrumb: PageInfo[] = [];
    let current = this.pages.get(slug);

    while (current) {
      breadcrumb.unshift(current);
      current = current.parent ? this.pages.get(current.parent) : undefined;
    }

    return breadcrumb;
  }

  /**
   * Get navigation structure
   */
  getNavigation(): TOCEntry[] {
    if (!this.config?.project?.toc) return [];

    return this.config.project.toc;
  }

  /**
   * Resolve cross-page references
   */
  resolveReference(ref: string, currentPage: string): string | null {
    // Handle different reference formats
    if (ref.startsWith('#')) {
      // Internal page reference
      return ref;
    }

    if (ref.includes('/')) {
      // File path reference
      const slug = this.generateSlug(ref);
      return this.pages.has(slug) ? `#${slug}` : null;
    }

    // Try to find by title or slug
    for (const [slug, page] of this.pages) {
      if (page.title === ref || slug === ref) {
        return `#${slug}`;
      }
    }

    return null;
  }

  /**
   * Generate page hierarchy for SharePoint
   */
  generatePageHierarchy(): Array<{
    page: PageInfo;
    level: number;
    parent?: PageInfo;
    children: PageInfo[];
  }> {
    const hierarchy: Array<{
      page: PageInfo;
      level: number;
      parent?: PageInfo;
      children: PageInfo[];
    }> = [];

    for (const page of this.getPagesInOrder()) {
      const parent = page.parent ? this.pages.get(page.parent) : undefined;
      const children = this.getChildren(page.slug);

      hierarchy.push({
        page,
        level: page.level,
        parent,
        children
      });
    }

    return hierarchy;
  }
}
