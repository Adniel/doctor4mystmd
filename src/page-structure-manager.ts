/**
 * Page Structure Manager - Manages hierarchical page organization and cross-references
 */

import { TOCParser, PageInfo } from './toc-parser';
import { MySTDocument } from './types';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface PageStructure {
  pages: Map<string, PageInfo>;
  hierarchy: Array<{
    page: PageInfo;
    level: number;
    parent?: PageInfo;
    children: PageInfo[];
  }>;
  navigation: {
    breadcrumbs: Map<string, PageInfo[]>;
    siblings: Map<string, PageInfo[]>;
    children: Map<string, PageInfo[]>;
  };
}

export interface CrossReference {
  from: string;
  to: string;
  type: 'internal' | 'external' | 'file';
  resolved: boolean;
  url?: string;
}

export class PageStructureManager {
  private tocParser: TOCParser;
  private pageStructure: PageStructure | null = null;
  private crossReferences: Map<string, CrossReference[]> = new Map();

  constructor() {
    this.tocParser = new TOCParser();
  }

  /**
   * Build page structure from myst.yml
   */
  async buildStructure(configPath: string, baseDir: string = '.'): Promise<PageStructure> {
    // Parse TOC configuration
    const pages = await this.tocParser.buildPageStructure(configPath, baseDir);
    
    // Generate hierarchy
    const hierarchy = this.tocParser.generatePageHierarchy();
    
    // Build navigation
    const navigation = this.buildNavigation(pages);
    
    this.pageStructure = {
      pages,
      hierarchy,
      navigation
    };

    return this.pageStructure;
  }

  /**
   * Build navigation structure
   */
  private buildNavigation(pages: Map<string, PageInfo>): PageStructure['navigation'] {
    const breadcrumbs = new Map<string, PageInfo[]>();
    const siblings = new Map<string, PageInfo[]>();
    const children = new Map<string, PageInfo[]>();

    for (const [slug, page] of pages) {
      // Build breadcrumbs
      breadcrumbs.set(slug, this.tocParser.getBreadcrumb(slug));
      
      // Build siblings
      const parent = this.tocParser.getParent(slug);
      if (parent) {
        const parentChildren = this.tocParser.getChildren(parent.slug);
        siblings.set(slug, parentChildren.filter(p => p.slug !== slug));
      } else {
        siblings.set(slug, []);
      }
      
      // Build children
      children.set(slug, this.tocParser.getChildren(slug));
    }

    return {
      breadcrumbs,
      siblings,
      children
    };
  }

  /**
   * Process cross-references in a document
   */
  async processCrossReferences(
    document: MySTDocument,
    currentPageSlug: string,
    baseDir: string
  ): Promise<CrossReference[]> {
    const references: CrossReference[] = [];
    
    // Find all reference nodes in the document
    const refNodes = this.findReferenceNodes(document);
    
    for (const node of refNodes) {
      const ref = this.extractReference(node);
      if (ref) {
        const crossRef = await this.resolveCrossReference(ref, currentPageSlug, baseDir);
        references.push(crossRef);
      }
    }

    this.crossReferences.set(currentPageSlug, references);
    return references;
  }

  /**
   * Find reference nodes in AST
   */
  private findReferenceNodes(document: MySTDocument): any[] {
    const refNodes: any[] = [];
    
    const traverse = (node: any) => {
      if (node.type === 'myst_role' && ['ref', 'cite', 'doc'].includes(node.name)) {
        refNodes.push(node);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    document.children.forEach(traverse);
    return refNodes;
  }

  /**
   * Extract reference from node
   */
  private extractReference(node: any): string | null {
    if (node.type === 'myst_role') {
      return node.value || node.children?.[0]?.value;
    }
    return null;
  }

  /**
   * Resolve cross-reference
   */
  private async resolveCrossReference(
    ref: string,
    currentPageSlug: string,
    baseDir: string
  ): Promise<CrossReference> {
    // Handle different reference types
    if (ref.startsWith('#')) {
      // Internal page reference
      return {
        from: currentPageSlug,
        to: ref.substring(1),
        type: 'internal',
        resolved: this.pageStructure?.pages.has(ref.substring(1)) || false,
        url: ref
      };
    }

    if (ref.startsWith('http')) {
      // External URL
      return {
        from: currentPageSlug,
        to: ref,
        type: 'external',
        resolved: true,
        url: ref
      };
    }

    if (ref.includes('/') || ref.endsWith('.md')) {
      // File reference
      const filePath = path.resolve(baseDir, ref);
      const slug = this.generateSlugFromPath(ref);
      
      return {
        from: currentPageSlug,
        to: slug,
        type: 'file',
        resolved: this.pageStructure?.pages.has(slug) || false,
        url: `#${slug}`
      };
    }

    // Try to resolve by title or slug
    const resolvedSlug = this.resolveByTitleOrSlug(ref);
    return {
      from: currentPageSlug,
      to: resolvedSlug || ref,
      type: 'internal',
      resolved: !!resolvedSlug,
      url: resolvedSlug ? `#${resolvedSlug}` : undefined
    };
  }

  /**
   * Resolve reference by title or slug
   */
  private resolveByTitleOrSlug(ref: string): string | null {
    if (!this.pageStructure) return null;

    for (const [slug, page] of this.pageStructure.pages) {
      if (page.title === ref || slug === ref) {
        return slug;
      }
    }
    return null;
  }

  /**
   * Generate slug from file path
   */
  private generateSlugFromPath(filePath: string): string {
    const baseName = path.basename(filePath, '.md');
    return baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate navigation HTML for a page
   */
  generateNavigationHTML(pageSlug: string, currentPageSlug: string): string {
    if (!this.pageStructure) return '';

    const page = this.pageStructure.pages.get(pageSlug);
    if (!page) return '';

    const breadcrumbs = this.pageStructure.navigation.breadcrumbs.get(pageSlug) || [];
    const siblings = this.pageStructure.navigation.siblings.get(pageSlug) || [];
    const children = this.pageStructure.navigation.children.get(pageSlug) || [];

    let html = '<nav class="myst-navigation">\n';

    // Breadcrumbs
    if (breadcrumbs.length > 1) {
      html += '  <div class="breadcrumbs">\n';
      html += '    <ol>\n';
      for (let i = 0; i < breadcrumbs.length; i++) {
        const crumb = breadcrumbs[i];
        const isLast = i === breadcrumbs.length - 1;
        const isCurrent = crumb.slug === currentPageSlug;
        
        html += '      <li>';
        if (isLast || isCurrent) {
          html += `<span class="${isCurrent ? 'current' : 'last'}">${crumb.title}</span>`;
        } else {
          html += `<a href="#${crumb.slug}">${crumb.title}</a>`;
        }
        html += '</li>\n';
      }
      html += '    </ol>\n';
      html += '  </div>\n';
    }

    // Siblings (previous/next)
    if (siblings.length > 0) {
      const currentIndex = siblings.findIndex(s => s.slug === currentPageSlug);
      const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
      const next = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

      html += '  <div class="page-navigation">\n';
      if (prev) {
        html += `    <a href="#${prev.slug}" class="prev-page">← ${prev.title}</a>\n`;
      }
      if (next) {
        html += `    <a href="#${next.slug}" class="next-page">${next.title} →</a>\n`;
      }
      html += '  </div>\n';
    }

    // Children (table of contents)
    if (children.length > 0) {
      html += '  <div class="page-toc">\n';
      html += '    <h3>In this section:</h3>\n';
      html += '    <ul>\n';
      for (const child of children) {
        const isCurrent = child.slug === currentPageSlug;
        html += `      <li><a href="#${child.slug}" class="${isCurrent ? 'current' : ''}">${child.title}</a></li>\n`;
      }
      html += '    </ul>\n';
      html += '  </div>\n';
    }

    html += '</nav>\n';
    return html;
  }

  /**
   * Generate site navigation HTML
   */
  generateSiteNavigationHTML(): string {
    if (!this.pageStructure) return '';

    const rootPages = this.tocParser.getRootPages();
    
    let html = '<nav class="site-navigation">\n';
    html += '  <ul class="main-nav">\n';
    
    for (const page of rootPages) {
      html += this.generateNavigationItemHTML(page, 0);
    }
    
    html += '  </ul>\n';
    html += '</nav>\n';
    
    return html;
  }

  /**
   * Generate navigation item HTML recursively
   */
  private generateNavigationItemHTML(page: PageInfo, level: number): string {
    const children = this.pageStructure?.navigation.children.get(page.slug) || [];
    const indent = '  '.repeat(level + 2);
    
    let html = `${indent}<li>\n`;
    html += `${indent}  <a href="#${page.slug}">${page.title}</a>\n`;
    
    if (children.length > 0) {
      html += `${indent}  <ul>\n`;
      for (const child of children) {
        html += this.generateNavigationItemHTML(child, level + 1);
      }
      html += `${indent}  </ul>\n`;
    }
    
    html += `${indent}</li>\n`;
    return html;
  }

  /**
   * Get page structure
   */
  getPageStructure(): PageStructure | null {
    return this.pageStructure;
  }

  /**
   * Get cross-references for a page
   */
  getCrossReferences(pageSlug: string): CrossReference[] {
    return this.crossReferences.get(pageSlug) || [];
  }

  /**
   * Get all cross-references
   */
  getAllCrossReferences(): Map<string, CrossReference[]> {
    return this.crossReferences;
  }
}
