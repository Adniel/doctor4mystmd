#!/usr/bin/env node

/**
 * Command Line Interface for Doctor4MySTMD
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MySTASTParser } from './ast-parser';
import { MySTASTTransformer } from './ast-transformer';
import { DoctorIntegration } from './doctor-integration';
import { PageStructureManager } from './page-structure-manager';
import { TOCParser } from './toc-parser';
import { FrontmatterParser } from './frontmatter-parser';
import { StaticResourceHandler, ResourceUploadOptions } from './static-resource-handler';
import { DoctorConfig, TransformOptions, PublishOptions } from './types';

const program = new Command();

program
  .name('doctor4mystmd')
  .description('Publish MyST Markdown content to SharePoint using Doctor')
  .version('1.0.0');

// Parse command
program
  .command('parse')
  .description('Parse MyST Markdown files to AST')
  .argument('<input>', 'Input file or directory')
  .option('-o, --output <path>', 'Output directory for AST files')
  .option('-p, --pattern <pattern>', 'File pattern for directory input', '**/*.md')
  .action(async (input: string, options: any) => {
    try {
      const parser = new MySTASTParser();
      const outputDir = options.output || './output';
      
      await fs.ensureDir(outputDir);
      
      const stat = await fs.stat(input);
      let asts: Map<string, any>;
      
      if (stat.isDirectory()) {
        asts = await parser.parseDirectory(input, options.pattern);
      } else {
        const ast = await parser.parseFile(input);
        asts = new Map([[input, ast]]);
      }
      
      // Save ASTs to files
      for (const [filePath, ast] of asts) {
        const fileName = path.basename(filePath, '.md');
        const outputPath = path.join(outputDir, `${fileName}.ast.json`);
        await fs.writeFile(outputPath, JSON.stringify(ast, null, 2), 'utf8');
        console.log(`✅ Parsed: ${filePath} -> ${outputPath}`);
      }
      
      console.log(`\n🎉 Successfully parsed ${asts.size} files`);
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }
  });

// Transform command
program
  .command('transform')
  .description('Transform MyST AST to Doctor-compatible format')
  .argument('<input>', 'Input file, directory, or AST file')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('-f, --format <format>', 'Output format (markdown|html)', 'markdown')
  .option('-p, --pattern <pattern>', 'File pattern for directory input', '**/*.md')
  .option('--preserve-myst', 'Preserve MyST-specific features', false)
  .action(async (input: string, options: any) => {
    try {
      const transformOptions: TransformOptions = {
        outputFormat: options.format as 'markdown' | 'html',
        preserveMySTFeatures: options.preserveMyst,
        customMappings: {}
      };
      
      const transformer = new MySTASTTransformer(transformOptions);
      const outputDir = options.output;
      
      await fs.ensureDir(outputDir);
      
      const stat = await fs.stat(input);
      let asts: Map<string, any>;
      
      if (stat.isDirectory()) {
        const parser = new MySTASTParser();
        asts = await parser.parseDirectory(input, options.pattern);
      } else if (input.endsWith('.ast.json')) {
        // Load existing AST file
        const ast = await fs.readJson(input);
        asts = new Map([[input, ast]]);
      } else {
        // Parse MyST file
        const parser = new MySTASTParser();
        const ast = await parser.parseFile(input);
        asts = new Map([[input, ast]]);
      }
      
      // Transform and save
      const results = await transformer.transformAndSave(asts, outputDir);
      
      for (const [inputPath, outputPath] of results) {
        console.log(`✅ Transformed: ${inputPath} -> ${outputPath}`);
      }
      
      console.log(`\n🎉 Successfully transformed ${results.size} files`);
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }
  });

// Publish command
program
  .command('publish')
  .description('Publish MyST content to SharePoint using Doctor')
  .argument('<input>', 'Input file or directory')
  .option('-s, --site-url <url>', 'SharePoint site URL (required)')
  .option('-l, --list-id <id>', 'SharePoint list ID')
  .option('-f, --folder-path <path>', 'SharePoint folder path')
  .option('-t, --title <title>', 'Page title')
  .option('-d, --description <desc>', 'Page description')
  .option('-p, --pattern <pattern>', 'File pattern for directory input', '**/*.md')
  .option('--format <format>', 'Output format (markdown|html)', 'markdown')
  .option('--preserve-myst', 'Preserve MyST-specific features', false)
  .option('--dry-run', 'Show what would be published without actually publishing', false)
  .action(async (input: string, options: any) => {
    try {
      if (!options.siteUrl) {
        console.error('❌ Error: --site-url is required');
        process.exit(1);
      }
      
      const doctorConfig: DoctorConfig = {
        siteUrl: options.siteUrl,
        listId: options.listId,
        folderPath: options.folderPath,
        authentication: {
          type: 'spfx'
        }
      };
      
      const transformOptions: TransformOptions = {
        outputFormat: options.format as 'markdown' | 'html',
        preserveMySTFeatures: options.preserveMyst,
        customMappings: {}
      };
      
      // Initialize components
      const parser = new MySTASTParser();
      const transformer = new MySTASTTransformer(transformOptions);
      const doctor = new DoctorIntegration(doctorConfig);
      
      // Initialize Doctor
      if (!options.dryRun) {
        await doctor.initialize();
      }
      
      // Parse input
      const stat = await fs.stat(input);
      let asts: Map<string, any>;
      
      if (stat.isDirectory()) {
        asts = await parser.parseDirectory(input, options.pattern);
      } else {
        const ast = await parser.parseFile(input);
        asts = new Map([[input, ast]]);
      }
      
      console.log(`📝 Found ${asts.size} files to process`);
      
      // Transform and publish
      for (const [filePath, ast] of asts) {
        try {
          console.log(`\n🔄 Processing: ${filePath}`);
          
          // Transform AST
          let content: string;
          if (options.format === 'html') {
            content = await transformer.transformToHTML(ast);
          } else {
            content = await transformer.transformToMarkdown(ast);
          }
          
          if (options.dryRun) {
            console.log(`📄 Would publish content (${content.length} characters)`);
            console.log(`   Title: ${options.title || path.basename(filePath, '.md')}`);
            console.log(`   Description: ${options.description || 'No description'}`);
          } else {
            // Publish to SharePoint
            const title = options.title || path.basename(filePath, '.md');
            const description = options.description || 'No description';
            
            await doctor.createPage(title, content, { description });
            console.log(`✅ Published: ${title}`);
          }
        } catch (error) {
          console.error(`❌ Failed to process ${filePath}: ${error}`);
        }
      }
      
      if (options.dryRun) {
        console.log(`\n🔍 Dry run completed. Use --dry-run=false to actually publish.`);
      } else {
        console.log(`\n🎉 Successfully published ${asts.size} files to SharePoint`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage Doctor configuration')
  .option('-s, --site-url <url>', 'Set SharePoint site URL')
  .option('-l, --list-id <id>', 'Set SharePoint list ID')
  .option('-f, --folder-path <path>', 'Set SharePoint folder path')
  .option('--show', 'Show current configuration')
  .action(async (options: any) => {
    try {
      const configPath = path.join(process.cwd(), 'doctor.config.json');
      
      if (options.show) {
        if (await fs.pathExists(configPath)) {
          const config = await fs.readJson(configPath);
          console.log('Current configuration:');
          console.log(JSON.stringify(config, null, 2));
        } else {
          console.log('No configuration file found. Use --site-url to create one.');
        }
        return;
      }
      
      if (options.siteUrl) {
        const config: DoctorConfig = {
          siteUrl: options.siteUrl,
          listId: options.listId,
          folderPath: options.folderPath,
          authentication: {
            type: 'spfx'
          }
        };
        
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`✅ Configuration saved to ${configPath}`);
      } else {
        console.log('Use --site-url to set the SharePoint site URL');
      }
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }
  });

// Publish with TOC command
program
  .command('publish-toc')
  .description('Publish MyST content using TOC structure from myst.yml')
  .argument('<config>', 'Path to myst.yml configuration file')
  .option('-s, --site-url <url>', 'SharePoint site URL (required)')
  .option('-l, --list-id <id>', 'SharePoint list ID')
  .option('-f, --folder-path <path>', 'SharePoint folder path')
  .option('-b, --base-dir <dir>', 'Base directory for content files', '.')
  .option('--format <format>', 'Output format (markdown|html)', 'markdown')
  .option('--preserve-myst', 'Preserve MyST-specific features', false)
  .option('--add-navigation', 'Add page navigation', true)
  .option('--add-site-navigation', 'Add site navigation', true)
  .option('--upload-resources', 'Upload static resources (images, CSS, JS) to SharePoint', false)
  .option('--assets-dir <dir>', 'Assets directory for static resources', 'assets')
  .option('--preserve-structure', 'Preserve directory structure when uploading resources', true)
  .option('--max-file-size <size>', 'Maximum file size for uploads in MB', '10')
  .option('--allowed-extensions <extensions>', 'Comma-separated list of allowed file extensions', 'jpg,jpeg,png,gif,svg,webp,ico,css,js,pdf,doc,docx,xls,xlsx,ppt,pptx,zip,tar,gz,woff,woff2,ttf,eot')
  .option('--excluded-patterns <patterns>', 'Comma-separated list of patterns to exclude from uploads')
  .option('--dry-run', 'Show what would be published without actually publishing', false)
  .action(async (config: string, options: any) => {
    try {
      if (!options.siteUrl) {
        console.error('❌ Error: --site-url is required');
        process.exit(1);
      }

      const doctorConfig: DoctorConfig = {
        siteUrl: options.siteUrl,
        listId: options.listId,
        folderPath: options.folderPath,
        authentication: {
          type: 'spfx'
        }
      };

      const transformOptions: TransformOptions = {
        outputFormat: options.format as 'markdown' | 'html',
        preserveMySTFeatures: options.preserveMyst,
        customMappings: {}
      };

      // Initialize components
      const parser = new MySTASTParser();
      const pageStructureManager = new PageStructureManager();
      const frontmatterParser = new FrontmatterParser();
      const staticResourceHandler = new StaticResourceHandler(doctorConfig);
      const transformer = new MySTASTTransformer(transformOptions, pageStructureManager, staticResourceHandler);
      const doctor = new DoctorIntegration(doctorConfig);

      // Initialize Doctor
      if (!options.dryRun) {
        await doctor.initialize();
      }

      // Build page structure from TOC
      console.log(`📖 Building page structure from ${config}...`);
      const pageStructure = await pageStructureManager.buildStructure(config, options.baseDir);
      
      console.log(`📝 Found ${pageStructure.pages.size} pages to process`);

      // Configure static resource handling if enabled
      let resourceOptions: ResourceUploadOptions | undefined;
      if (options.uploadResources) {
        resourceOptions = {
          baseDir: options.baseDir,
          assetsDir: options.assetsDir,
          uploadToSharePoint: !options.dryRun,
          preserveStructure: options.preserveStructure,
          maxFileSize: parseInt(options.maxFileSize) * 1024 * 1024, // Convert MB to bytes
          allowedExtensions: options.allowedExtensions.split(',').map((ext: string) => `.${ext.trim()}`),
          excludedPatterns: options.excludedPatterns ? options.excludedPatterns.split(',').map((pattern: string) => pattern.trim()) : undefined
        };
        transformer.setResourceUploadOptions(resourceOptions);
      }

      // Process each page
      for (const [slug, page] of pageStructure.pages) {
        if (!page.filePath) continue; // Skip section headers without files
        
        try {
          console.log(`\n🔄 Processing: ${page.title} (${slug})`);
          
          // Parse MyST content with frontmatter
          const { ast, frontmatter } = await parser.parseFileWithFrontmatter(page.filePath);
          
          if (options.dryRun) {
            console.log(`📄 Would publish content from ${page.filePath}`);
            console.log(`   Title: ${frontmatter.title || page.title}`);
            console.log(`   Level: ${page.level}`);
            console.log(`   Order: ${page.order + 1}`);
            
            if (Object.keys(frontmatter).length > 0) {
              console.log(`   Metadata: ${frontmatterParser.generateMetadataSummary(frontmatter)}`);
            }

            // Show static resources that would be uploaded
            if (options.uploadResources && resourceOptions) {
              const resources = await staticResourceHandler.extractResources(
                await fs.readFile(page.filePath, 'utf8'),
                page.filePath,
                resourceOptions
              );
              if (resources.length > 0) {
                console.log(`   📦 Would upload ${resources.length} static resources:`);
                for (const resource of resources) {
                  console.log(`      - ${resource.relativePath} (${Math.round(resource.fileSize / 1024)}KB)`);
                }
              }
            }
            continue;
          }

          // Set current page context for cross-references
          transformer.setCurrentPage(slug);
          
          // Process cross-references
          await pageStructureManager.processCrossReferences(ast, slug, options.baseDir);
          
          // Transform AST to content (with static resource handling)
          let content: string;
          if (options.format === 'html') {
            content = await transformer.transformToHTML(ast, page.filePath);
          } else {
            content = await transformer.transformToMarkdown(ast, page.filePath);
          }
          
          // Add navigation if requested
          if (options.addNavigation) {
            content = transformer.addNavigationToContent(content, slug);
          }
          
          if (options.addSiteNavigation && page.level === 0) {
            content = transformer.addSiteNavigationToContent(content);
          }
          
          // Map frontmatter to SharePoint metadata
          const sharePointMetadata = frontmatterParser.mapToSharePointMetadata(frontmatter);
          
          // Use frontmatter title if available, otherwise use page title
          const title = frontmatter.title || page.title;
          
          // Publish to SharePoint with metadata
          await doctor.createPage(title, content, {
            description: sharePointMetadata.Description || `Page ${page.order + 1} of ${pageStructure.pages.size}`,
            metadata: sharePointMetadata
          });
          
          console.log(`✅ Published: ${title}`);
          
          // Log metadata if available
          if (Object.keys(frontmatter).length > 0) {
            console.log(`   Metadata: ${frontmatterParser.generateMetadataSummary(frontmatter)}`);
          }
        } catch (error) {
          console.error(`❌ Failed to process ${page.filePath}: ${error}`);
        }
      }

      if (options.dryRun) {
        console.log(`\n🔍 Dry run completed. Use --dry-run=false to actually publish.`);
      } else {
        console.log(`\n🎉 Successfully published ${pageStructure.pages.size} pages to SharePoint`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List SharePoint pages')
  .option('-s, --site-url <url>', 'SharePoint site URL')
  .action(async (options: any) => {
    try {
      const configPath = path.join(process.cwd(), 'doctor.config.json');
      let config: DoctorConfig;
      
      if (options.siteUrl) {
        config = {
          siteUrl: options.siteUrl,
          listId: options.listId,
          folderPath: options.folderPath,
          authentication: { type: 'spfx' }
        };
      } else if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
      } else {
        console.error('❌ Error: No site URL provided and no configuration file found');
        process.exit(1);
        return; // This line will never be reached, but satisfies TypeScript
      }
      
      const doctor = new DoctorIntegration(config);
      await doctor.initialize();
      
      const pages = await doctor.listPages();
      
      if (pages.length === 0) {
        console.log('No pages found');
      } else {
        console.log(`Found ${pages.length} pages:`);
        pages.forEach(page => {
          console.log(`  ${page.id}: ${page.title} (${page.url})`);
        });
      }
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
