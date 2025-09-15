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
