/**
 * Main entry point for Doctor4MySTMD
 */

import { MySTASTParser } from './ast-parser';
import { MySTASTTransformer } from './ast-transformer';
import { DoctorIntegration } from './doctor-integration';
import { PageStructureManager } from './page-structure-manager';
import { TOCParser } from './toc-parser';
import { FrontmatterParser, SharePointMetadata } from './frontmatter-parser';
import { StaticResourceHandler, ResourceUploadOptions } from './static-resource-handler';
import { DoctorConfig, TransformOptions } from './types';

export { MySTASTParser } from './ast-parser';
export { MySTASTTransformer } from './ast-transformer';
export { DoctorIntegration } from './doctor-integration';
export { PageStructureManager } from './page-structure-manager';
export { TOCParser } from './toc-parser';
export { FrontmatterParser } from './frontmatter-parser';
export { StaticResourceHandler } from './static-resource-handler';
export * from './types';

// Main application class
export class Doctor4MySTMD {
  private parser: MySTASTParser;
  private transformer: MySTASTTransformer;
  private doctor: DoctorIntegration;
  private pageStructureManager: PageStructureManager;
  private tocParser: TOCParser;
  private frontmatterParser: FrontmatterParser;
  private staticResourceHandler: StaticResourceHandler;

  constructor(
    doctorConfig: DoctorConfig,
    transformOptions: TransformOptions,
    mystmdPath: string = 'npx mystmd',
    doctorPath: string = 'doctor'
  ) {
    this.parser = new MySTASTParser(mystmdPath);
    this.pageStructureManager = new PageStructureManager();
    this.tocParser = new TOCParser();
    this.frontmatterParser = new FrontmatterParser();
    this.staticResourceHandler = new StaticResourceHandler(doctorConfig, doctorPath);
    this.transformer = new MySTASTTransformer(transformOptions, this.pageStructureManager, this.staticResourceHandler);
    this.doctor = new DoctorIntegration(doctorConfig, doctorPath);
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    await this.doctor.initialize();
  }

  /**
   * Process and publish MyST content
   */
  async processAndPublish(
    inputPath: string,
    options: {
      title?: string;
      description?: string;
      pattern?: string;
    } = {}
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    try {
      // Parse MyST content
      const stat = await import('fs-extra').then(fs => fs.stat(inputPath));
      let asts: Map<string, any>;
      
      if (stat.isDirectory()) {
        asts = await this.parser.parseDirectory(inputPath, options.pattern || '**/*.md');
      } else {
        const ast = await this.parser.parseFile(inputPath);
        asts = new Map([[inputPath, ast]]);
      }
      
      // Process each file
      for (const [filePath, ast] of asts) {
        try {
          // Transform AST to content
          let content: string;
          if (this.transformer['options'].outputFormat === 'html') {
            content = await this.transformer.transformToHTML(ast);
          } else {
            content = await this.transformer.transformToMarkdown(ast);
          }
          
          // Publish to SharePoint
          const title = options.title || require('path').basename(filePath, '.md');
          const description = options.description || 'No description';
          
          await this.doctor.createPage(title, content, { description });
          results.set(filePath, true);
        } catch (error) {
          console.error(`Failed to process ${filePath}: ${error}`);
          results.set(filePath, false);
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to process and publish content: ${error}`);
    }
  }

  /**
   * Process and publish MyST content with TOC structure
   */
  async processAndPublishWithTOC(
    configPath: string,
    baseDir: string = '.',
    options: {
      addNavigation?: boolean;
      addSiteNavigation?: boolean;
      uploadResources?: boolean;
      resourceOptions?: ResourceUploadOptions;
    } = {}
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    try {
      // Build page structure from TOC
      const pageStructure = await this.pageStructureManager.buildStructure(configPath, baseDir);
      
      // Process each page
      for (const [slug, page] of pageStructure.pages) {
        if (!page.filePath) continue; // Skip section headers without files
        
        try {
          console.log(`Processing page: ${page.title} (${slug})`);
          
          // Parse MyST content with frontmatter
          const { ast, frontmatter } = await this.parser.parseFileWithFrontmatter(page.filePath);
          
          // Set current page context for cross-references
          this.transformer.setCurrentPage(slug);
          
          // Process cross-references
          await this.pageStructureManager.processCrossReferences(ast, slug, baseDir);
          
          // Configure static resource handling if enabled
          if (options.uploadResources && options.resourceOptions) {
            this.transformer.setResourceUploadOptions(options.resourceOptions);
          }
          
          // Transform AST to content
          let content: string;
          if (this.transformer['options'].outputFormat === 'html') {
            content = await this.transformer.transformToHTML(ast, page.filePath);
          } else {
            content = await this.transformer.transformToMarkdown(ast, page.filePath);
          }
          
          // Add navigation if requested
          if (options.addNavigation) {
            content = this.transformer.addNavigationToContent(content, slug);
          }
          
          if (options.addSiteNavigation && page.level === 0) {
            content = this.transformer.addSiteNavigationToContent(content);
          }
          
          // Map frontmatter to SharePoint metadata
          const sharePointMetadata = this.frontmatterParser.mapToSharePointMetadata(frontmatter);
          
          // Use frontmatter title if available, otherwise use page title
          const title = frontmatter.title || page.title;
          
          // Publish to SharePoint with metadata
          await this.doctor.createPage(title, content, {
            description: sharePointMetadata.Description || `Page ${page.order + 1} of ${pageStructure.pages.size}`,
            metadata: sharePointMetadata
          });
          
          results.set(page.filePath, true);
          console.log(`✅ Published: ${title}`);
          
          // Log metadata if available
          if (Object.keys(frontmatter).length > 0) {
            console.log(`   Metadata: ${this.frontmatterParser.generateMetadataSummary(frontmatter)}`);
          }
        } catch (error) {
          console.error(`❌ Failed to process ${page.filePath}: ${error}`);
          results.set(page.filePath, false);
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to process and publish content with TOC: ${error}`);
    }
  }

  /**
   * Get page structure
   */
  getPageStructure() {
    return this.pageStructureManager.getPageStructure();
  }

  /**
   * Get TOC parser
   */
  getTOCParser() {
    return this.tocParser;
  }

  /**
   * Get page structure manager
   */
  getPageStructureManager() {
    return this.pageStructureManager;
  }
}
